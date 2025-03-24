const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { Client } = require('ssh2');
const fs = require('fs');
const os = require('os');

// Configurar almacenamiento persistente
const store = new Store({
  schema: {
    sshProfiles: {
      type: 'array',
      default: [],
    },
    favorites: {
      type: 'array',
      default: [],
    },
  },
});

let mainWindow;
const activeConnections = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');

  // Abrir DevTools en desarrollo
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Manejar eventos desde el renderer
ipcMain.handle('get-ssh-profiles', async () => {
  return store.get('sshProfiles', []);
});

ipcMain.handle('get-favorites', async () => {
  return store.get('favorites', []);
});

ipcMain.handle('toggle-favorite', async (event, profileName) => {
  const favorites = store.get('favorites', []);
  const index = favorites.indexOf(profileName);

  if (index === -1) {
    // Añadir a favoritos
    favorites.push(profileName);
  } else {
    // Quitar de favoritos
    favorites.splice(index, 1);
  }

  store.set('favorites', favorites);
  return favorites;
});

ipcMain.handle('save-ssh-profile', async (event, profile) => {
  const profiles = store.get('sshProfiles', []);

  // Si ya existe un perfil con el mismo nombre, actualizarlo
  const existingIndex = profiles.findIndex(p => p.name === profile.name);

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }

  store.set('sshProfiles', profiles);
  return profiles;
});

ipcMain.handle('delete-ssh-profile', async (event, profileName) => {
  const profiles = store.get('sshProfiles', []);
  const updatedProfiles = profiles.filter(p => p.name !== profileName);
  store.set('sshProfiles', updatedProfiles);
  return updatedProfiles;
});

ipcMain.handle('select-key-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Archivos de Clave', extensions: ['pem', 'key', 'ppk'] },
      { name: 'Todos los Archivos', extensions: ['*'] },
    ],
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('connect-ssh', async (event, profile) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      // Guardar la conexión activa
      activeConnections.set(profile.name, conn);
      resolve({ success: true, message: 'Conexión establecida con éxito' });
    });

    conn.on('error', err => {
      reject({ success: false, message: `Error al conectar: ${err.message}` });
    });

    const config = {
      host: profile.host,
      port: profile.port || 22,
      username: profile.username,
      keepaliveInterval: 10000, // Mantener conexión activa
    };

    // Configurar autenticación
    if (profile.authType === 'password') {
      config.password = profile.password;
    } else if (profile.authType === 'keyFile') {
      try {
        config.privateKey = fs.readFileSync(profile.keyFile);
        if (profile.passphrase) {
          config.passphrase = profile.passphrase;
        }
      } catch (err) {
        reject({ success: false, message: `Error al leer archivo de clave: ${err.message}` });
        return;
      }
    }

    // Intentar la conexión
    conn.connect(config);
  });
});

// Abrir una shell interactiva
ipcMain.handle('open-shell', async (event, profileName) => {
  const conn = activeConnections.get(profileName);

  if (!conn) {
    return { success: false, message: 'No hay conexión activa para este perfil' };
  }

  return new Promise((resolve, reject) => {
    conn.shell((err, stream) => {
      if (err) {
        reject({ success: false, message: `Error al abrir shell: ${err.message}` });
        return;
      }

      // Crear ventana para la terminal
      const terminalWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: `SSH Terminal - ${profileName}`,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Almacenar el stream para esta ventana
      terminalWindow.sshStream = stream;
      terminalWindow.profileName = profileName;

      terminalWindow.loadFile('terminal.html');

      // Configurar el stream para reenviar datos a la ventana
      stream.on('data', data => {
        if (!terminalWindow.isDestroyed()) {
          terminalWindow.webContents.send('terminal-data', data);
        }
      });

      stream.on('close', () => {
        if (!terminalWindow.isDestroyed()) {
          terminalWindow.webContents.send('terminal-data', '\r\n\x1b[1;31mConexión cerrada\x1b[0m\r\n');
        }
      });

      // Manejar cierre de ventana
      terminalWindow.on('closed', () => {
        if (stream) {
          stream.end();
        }
      });

      resolve({ success: true, message: 'Terminal abierta' });
    });
  });
});

// Enviar datos a la terminal
ipcMain.handle('terminal-input', (event, { data, windowId }) => {
  const win = BrowserWindow.getAllWindows().find(w => w.id === windowId);
  if (win && win.sshStream) {
    win.sshStream.write(data);
    return true;
  }
  return false;
});

// Obtener el ID de la ventana
ipcMain.handle('get-window-id', event => {
  return BrowserWindow.fromWebContents(event.sender).id;
});

// Cerrar conexión SSH
ipcMain.handle('disconnect-ssh', (event, profileName) => {
  const conn = activeConnections.get(profileName);
  if (conn) {
    conn.end();
    activeConnections.delete(profileName);
    return { success: true, message: 'Desconectado' };
  }
  return { success: false, message: 'No hay conexión activa' };
});
