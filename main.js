const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { Client } = require('ssh2');
const fs = require('fs');

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

function encryptValue(value) {
  if (!value || !safeStorage.isEncryptionAvailable()) {
    return value;
  }
  return safeStorage.encryptString(value).toString('base64');
}

function decryptValue(value) {
  if (!value || !safeStorage.isEncryptionAvailable()) {
    return value;
  }
  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return value; // Fallback para perfiles guardados antes del cifrado
  }
}

function getDecryptedProfiles() {
  const profiles = store.get('sshProfiles', []);
  return profiles.map(p => ({
    ...p,
    password: p.password ? decryptValue(p.password) : p.password,
    passphrase: p.passphrase ? decryptValue(p.passphrase) : p.passphrase,
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1800,
    height: 1169,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');

  // Abrir DevTools en desarrollo (descomentar para depuración)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-ssh-profiles', async () => {
  return getDecryptedProfiles();
});

ipcMain.handle('get-favorites', async () => {
  return store.get('favorites', []);
});

ipcMain.handle('toggle-favorite', async (event, profileName) => {
  const favorites = store.get('favorites', []);
  const index = favorites.indexOf(profileName);

  if (index === -1) {
    favorites.push(profileName);
  } else {
    favorites.splice(index, 1);
  }

  store.set('favorites', favorites);
  return favorites;
});

ipcMain.handle('save-ssh-profile', async (event, profile) => {
  const profiles = store.get('sshProfiles', []);

  const profileToStore = {
    ...profile,
    password: profile.password ? encryptValue(profile.password) : profile.password,
    passphrase: profile.passphrase ? encryptValue(profile.passphrase) : profile.passphrase,
  };

  const existingIndex = profiles.findIndex(p => p.name === profileToStore.name);
  if (existingIndex >= 0) {
    profiles[existingIndex] = profileToStore;
  } else {
    profiles.push(profileToStore);
  }

  store.set('sshProfiles', profiles);
  return getDecryptedProfiles();
});

ipcMain.handle('delete-ssh-profile', async (event, profileName) => {
  const profiles = store.get('sshProfiles', []);
  const updatedProfiles = profiles.filter(p => p.name !== profileName);
  store.set('sshProfiles', updatedProfiles);

  const favorites = store.get('favorites', []);
  if (favorites.includes(profileName)) {
    const updatedFavorites = favorites.filter(name => name !== profileName);
    store.set('favorites', updatedFavorites);
  }

  return getDecryptedProfiles();
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
      keepaliveInterval: 10000,
    };

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

    conn.connect(config);
  });
});

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

      const webContents = event.sender;

      stream.on('data', data => {
        if (!webContents.isDestroyed()) {
          webContents.send('terminal-data', data);
        }
      });

      stream.on('close', () => {
        if (!webContents.isDestroyed()) {
          webContents.send('terminal-data', '\r\n\x1b[1;31mConexión cerrada\x1b[0m\r\n');
        }
      });

      stream.on('error', err => {
        if (!webContents.isDestroyed()) {
          webContents.send('terminal-data', `\r\n\x1b[1;31mError: ${err.message}\x1b[0m\r\n`);
        }
      });

      event.sender.sshStream = stream;
      resolve({ success: true, message: 'Terminal abierta' });
    });
  });
});

ipcMain.handle('terminal-input', (event, data) => {
  const webContents = event.sender;

  if (webContents && webContents.sshStream) {
    webContents.sshStream.write(data);
    return true;
  }
  return false;
});

ipcMain.handle('resize-terminal', (event, cols, rows) => {
  const stream = event.sender.sshStream;
  if (stream) {
    stream.setWindow(rows, cols, 0, 0);
    return true;
  }
  return false;
});

ipcMain.handle('disconnect-ssh', (event, profileName) => {
  const conn = activeConnections.get(profileName);
  if (conn) {
    if (event.sender.sshStream) {
      event.sender.sshStream.end();
      event.sender.sshStream = null;
    }

    conn.end();
    activeConnections.delete(profileName);
    return { success: true, message: 'Desconectado' };
  }
  return { success: false, message: 'No hay conexión activa' };
});
