// terminal.js - Script para la terminal SSH
// Este script maneja la interacción entre xterm.js y la conexión SSH

let terminal;
let fitAddon;
let windowId;

// Inicializar la terminal
async function initTerminal() {
  try {
    // Obtener ID de la ventana actual
    windowId = await window.sshManager.getWindowId();

    // Detectar si estamos en Windows para líneas de comandos específicas
    const isWindows = navigator.platform.indexOf('Win') > -1;

    // Configurar la terminal
    terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Consolas, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        cursor: '#ffffff',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#d0d0d0',
        brightBlack: '#808080',
        brightRed: '#ff5370',
        brightGreen: '#c3e88d',
        brightYellow: '#ffcb6b',
        brightBlue: '#82aaff',
        brightMagenta: '#c792ea',
        brightCyan: '#89ddff',
        brightWhite: '#ffffff',
      },
      scrollback: 10000,
      cols: 80,
      rows: 24,
    });

    // Cargar el addon de ajuste automático
    fitAddon = new FitAddon.FitAddon();
    terminal.loadAddon(fitAddon);

    // Abrir la terminal en el contenedor
    terminal.open(document.getElementById('terminal-container'));
    fitAddon.fit();

    // Manejar entrada del usuario
    terminal.onData(data => {
      // Enviar datos a través del IPC al proceso principal
      window.sshManager.terminalInput(data, windowId);
    });

    // Cuando la ventana cambia de tamaño, ajustar la terminal
    window.addEventListener('resize', handleResize);

    // Manejar datos recibidos desde el servidor SSH
    window.sshManager.onTerminalData((event, data) => {
      if (data && typeof data === 'string') {
        terminal.write(data);
      } else if (data instanceof Uint8Array) {
        terminal.write(new TextDecoder().decode(data));
      }
    });

    // Enfoque automático en la terminal
    terminal.focus();

    // Mensaje de bienvenida
    terminal.write(
      '\x1b[1;34mTerminal SSH conectada. Presiona Ctrl+C para interrumpir o escriba "exit" para salir.\x1b[0m\r\n'
    );
  } catch (error) {
    console.error('Error inicializando terminal:', error);
    document.getElementById('terminal-container').innerHTML =
      `<div style="color: red; padding: 20px;">Error al inicializar la terminal: ${error.message}</div>`;
  }
}

// Manejar cambio de tamaño de la ventana
function handleResize() {
  try {
    if (fitAddon) {
      fitAddon.fit();

      // Enviar nuevas dimensiones al servidor SSH si es necesario
      // Esto puede ser útil para algunos servidores que ajustan la salida según el tamaño
      const dims = {
        cols: terminal.cols,
        rows: terminal.rows,
      };
      // Aquí podríamos enviar estas dimensiones al servidor
    }
  } catch (error) {
    console.error('Error al redimensionar terminal:', error);
  }
}

// Configurar botones de la interfaz
function setupButtons() {
  // Botón para limpiar la terminal
  document.getElementById('clearBtn').addEventListener('click', () => {
    terminal.clear();
  });

  // Control de tamaño de fuente
  let fontSize = 14;

  document.getElementById('increaseFontBtn').addEventListener('click', () => {
    if (fontSize < 24) {
      fontSize += 1;
      terminal.setOption('fontSize', fontSize);
      fitAddon.fit();
    }
  });

  document.getElementById('decreaseFontBtn').addEventListener('click', () => {
    if (fontSize > 8) {
      fontSize -= 1;
      terminal.setOption('fontSize', fontSize);
      fitAddon.fit();
    }
  });

  // Botón de desconexión
  document.getElementById('disconnectBtn').addEventListener('click', async () => {
    const result = await window.sshManager.disconnectSSH(window.profileName);
    terminal.write('\r\n\x1b[1;31mDesconectado del servidor.\x1b[0m\r\n');

    // Opcional: cerrar la ventana después de un tiempo
    setTimeout(() => {
      window.close();
    }, 1500);
  });
}

// Inicializar la terminal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initTerminal().then(() => {
    setupButtons();
  });
});

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
  // Realizar limpieza si es necesario
  if (terminal) {
    terminal.dispose();
  }

  window.removeEventListener('resize', handleResize);
});
