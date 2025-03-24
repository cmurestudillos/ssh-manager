document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM - Panel de lista
  const profileList = document.getElementById('profileList');
  const allTab = document.getElementById('allTab');
  const favoritesTab = document.getElementById('favoritesTab');
  const newProfileButton = document.getElementById('newProfileButton');
  const welcomeNewButton = document.getElementById('welcomeMessage').querySelector('button'); // Nuevo botón en el mensaje de bienvenida

  // Referencias a elementos del DOM - Panel de información
  const selectedProfileInfo = document.getElementById('selectedProfileInfo');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const profileNameDisplay = document.getElementById('profileName');
  const profileHostDisplay = document.getElementById('profileHost');
  const profilePortDisplay = document.getElementById('profilePort');
  const profileUsernameDisplay = document.getElementById('profileUsername');
  const profileAuthTypeDisplay = document.getElementById('profileAuthType');
  const connectButton = document.getElementById('connectButton');
  const editButton = document.getElementById('editButton');
  const deleteButton = document.getElementById('deleteButton');
  const openTerminalButton = document.getElementById('openTerminalButton');
  const statusMessage = document.getElementById('statusMessage');
  const terminalContainer = document.getElementById('terminalContainer');
  const embeddedTerminal = document.getElementById('embeddedTerminal');

  // Referencias a elementos de la terminal
  const clearTerminalBtn = document.getElementById('clearTerminalBtn');
  const increaseFontBtn = document.getElementById('increaseFontBtn');
  const decreaseFontBtn = document.getElementById('decreaseFontBtn');
  const closeTerminalBtn = document.getElementById('closeTerminalBtn');

  // Referencias a elementos del DOM - Modal
  const profileModal = document.getElementById('profileModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');
  const modalProfileName = document.getElementById('modalProfileName');
  const modalHost = document.getElementById('modalHost');
  const modalPort = document.getElementById('modalPort');
  const modalUsername = document.getElementById('modalUsername');
  const modalAuthType = document.getElementById('modalAuthType');
  const modalPassword = document.getElementById('modalPassword');
  const modalPasswordGroup = document.getElementById('modalPasswordGroup');
  const modalKeyFile = document.getElementById('modalKeyFile');
  const modalKeyFileGroup = document.getElementById('modalKeyFileGroup');
  const modalPassphrase = document.getElementById('modalPassphrase');
  const modalPassphraseGroup = document.getElementById('modalPassphraseGroup');
  const modalBrowseKeyFile = document.getElementById('modalBrowseKeyFile');

  // Variables para la terminal integrada
  let terminal = null;
  let fitAddon = null;
  let terminalFontSize = 14;

  // Variables de estado
  let currentProfiles = [];
  let favorites = [];
  let selectedProfile = null;
  let activeTab = 'all'; // 'all' o 'favorites'
  let isNewProfile = false; // Para controlar si estamos creando un nuevo perfil

  // Cargar perfiles y favoritos al inicio
  loadProfiles();

  // Event Listeners - Pestañas y botones principales
  allTab.addEventListener('click', () => switchTab('all'));
  favoritesTab.addEventListener('click', () => switchTab('favorites'));
  newProfileButton.addEventListener('click', createNewProfile);
  if (welcomeNewButton) welcomeNewButton.addEventListener('click', createNewProfile);

  // Event Listeners - Acciones de perfil
  connectButton.addEventListener('click', connectSSH);
  openTerminalButton.addEventListener('click', openEmbeddedTerminal);
  editButton.addEventListener('click', editProfile);
  deleteButton.addEventListener('click', deleteProfile);

  // Event Listeners - Terminal
  clearTerminalBtn.addEventListener('click', clearTerminal);
  increaseFontBtn.addEventListener('click', increaseTerminalFont);
  decreaseFontBtn.addEventListener('click', decreaseTerminalFont);
  closeTerminalBtn.addEventListener('click', closeTerminal);

  // Event Listeners - Modal
  modalAuthType.addEventListener('change', updateModalAuthFields);
  modalBrowseKeyFile.addEventListener('click', selectKeyFile);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveProfile);

  // Funciones principales

  // Cargar perfiles desde el almacenamiento
  async function loadProfiles() {
    try {
      currentProfiles = await window.sshManager.getProfiles();
      favorites = await window.sshManager.getFavorites();
      renderProfileList();
      updateInfoPanel();
    } catch (err) {
      console.error('Error cargando perfiles:', err);
      showStatus(`Error al cargar perfiles: ${err.message}`, false);
    }
  }

  // Cambiar entre pestañas "Todos" y "Favoritos"
  function switchTab(tab) {
    activeTab = tab;

    // Actualizar clases CSS de pestañas
    if (tab === 'all') {
      allTab.classList.add('active');
      favoritesTab.classList.remove('active');
    } else {
      allTab.classList.remove('active');
      favoritesTab.classList.add('active');
    }

    renderProfileList();
  }

  // Renderizar la lista de perfiles
  function renderProfileList() {
    profileList.innerHTML = '';

    // Filtrar perfiles según la pestaña activa
    let profilesToShow = [];

    if (activeTab === 'all') {
      profilesToShow = currentProfiles;
    } else {
      // 'favorites'
      profilesToShow = currentProfiles.filter(profile => favorites.includes(profile.name));
    }

    if (profilesToShow.length === 0) {
      const message = activeTab === 'all' ? 'No hay perfiles guardados' : 'No hay perfiles favoritos';
      profileList.innerHTML = `<li>${message}</li>`;
      return;
    }

    profilesToShow.forEach(profile => {
      const li = document.createElement('li');
      li.className = 'profile-item';

      // Marcar como activo si está seleccionado
      if (selectedProfile && selectedProfile.name === profile.name) {
        li.classList.add('active');
      }

      // Verificar si es favorito
      const isFavorite = favorites.includes(profile.name);

      li.innerHTML = `
        <div>
          <span>${profile.name}</span>
          <div class="profile-details">${profile.username}@${profile.host}</div>
        </div>
        <div>
          <span class="favorite-icon ${isFavorite ? 'active' : ''}" data-name="${profile.name}">❤</span>
        </div>
      `;

      // Evento para seleccionar perfil
      li.addEventListener('click', e => {
        // No seleccionar si se hizo clic en el ícono de favorito
        if (!e.target.classList.contains('favorite-icon')) {
          selectProfile(profile);
        }
      });

      profileList.appendChild(li);
    });

    // Añadir listeners para íconos de favoritos
    document.querySelectorAll('.favorite-icon').forEach(icon => {
      icon.addEventListener('click', async e => {
        e.stopPropagation();
        const profileName = e.target.dataset.name;
        favorites = await window.sshManager.toggleFavorite(profileName);
        renderProfileList();
      });
    });
  }

  // Actualizar el panel de información
  function updateInfoPanel() {
    if (selectedProfile) {
      // Mostrar información del perfil seleccionado
      selectedProfileInfo.classList.remove('hidden');
      welcomeMessage.classList.add('hidden');

      // Actualizar los datos mostrados
      profileNameDisplay.textContent = selectedProfile.name;
      profileHostDisplay.textContent = selectedProfile.host;
      profilePortDisplay.textContent = selectedProfile.port || 22;
      profileUsernameDisplay.textContent = selectedProfile.username;
      profileAuthTypeDisplay.textContent = selectedProfile.authType === 'password' ? 'Contraseña' : 'Archivo de clave';

      // Reiniciar estado de botones
      openTerminalButton.disabled = true;
      openTerminalButton.classList.add('hidden');
    } else {
      // Mostrar mensaje de bienvenida
      selectedProfileInfo.classList.add('hidden');
      welcomeMessage.classList.remove('hidden');
    }
  }

  // Seleccionar un perfil
  function selectProfile(profile) {
    // Actualizar perfil seleccionado
    selectedProfile = profile;

    // Actualizar UI para mostrar perfil seleccionado
    renderProfileList();
    updateInfoPanel();
  }

  // Crear nuevo perfil
  function createNewProfile() {
    isNewProfile = true;
    modalTitle.textContent = 'Nueva Conexión';

    // Limpiar formulario
    clearModalForm();

    // Mostrar modal
    openModal();
  }

  // Editar perfil existente
  function editProfile() {
    if (!selectedProfile) return;

    isNewProfile = false;
    modalTitle.textContent = 'Editar Conexión';

    // Llenar formulario con datos del perfil
    fillModalForm(selectedProfile);

    // Mostrar modal
    openModal();
  }

  // Abrir modal
  function openModal() {
    profileModal.classList.add('active');
  }

  // Cerrar modal
  function closeModal() {
    profileModal.classList.remove('active');
  }

  // Limpiar formulario modal
  function clearModalForm() {
    modalProfileName.value = '';
    modalHost.value = '';
    modalPort.value = '22';
    modalUsername.value = '';
    modalAuthType.value = 'password';
    modalPassword.value = '';
    modalKeyFile.value = '';
    modalPassphrase.value = '';

    // Actualizar campos visibles
    updateModalAuthFields();
  }

  // Llenar formulario modal con datos del perfil
  function fillModalForm(profile) {
    modalProfileName.value = profile.name;
    modalHost.value = profile.host;
    modalPort.value = profile.port || '22';
    modalUsername.value = profile.username;
    modalAuthType.value = profile.authType || 'password';

    if (profile.authType === 'password') {
      modalPassword.value = profile.password || '';
    } else {
      modalKeyFile.value = profile.keyFile || '';
      modalPassphrase.value = profile.passphrase || '';
    }

    // Actualizar campos visibles
    updateModalAuthFields();
  }

  // Actualizar campos de autenticación en el modal
  function updateModalAuthFields() {
    const authType = modalAuthType.value;

    if (authType === 'password') {
      modalPasswordGroup.classList.remove('hidden');
      modalKeyFileGroup.classList.add('hidden');
      modalPassphraseGroup.classList.add('hidden');
    } else {
      // keyFile
      modalPasswordGroup.classList.add('hidden');
      modalKeyFileGroup.classList.remove('hidden');
      modalPassphraseGroup.classList.remove('hidden');
    }
  }

  // Seleccionar archivo de clave
  async function selectKeyFile() {
    const filePath = await window.sshManager.selectKeyFile();
    if (filePath) {
      modalKeyFile.value = filePath;
    }
  }

  // Guardar perfil
  async function saveProfile() {
    try {
      const profile = {
        name: modalProfileName.value,
        host: modalHost.value,
        port: parseInt(modalPort.value) || 22,
        username: modalUsername.value,
        authType: modalAuthType.value,
      };

      if (profile.authType === 'password') {
        profile.password = modalPassword.value;
      } else {
        profile.keyFile = modalKeyFile.value;
        profile.passphrase = modalPassphrase.value;
      }

      // Validar campos requeridos
      if (!profile.name || !profile.host || !profile.username) {
        showStatus('Por favor, rellena todos los campos obligatorios', false);
        return;
      }

      if (profile.authType === 'password' && !profile.password) {
        showStatus('Por favor, introduce una contraseña', false);
        return;
      }

      if (profile.authType === 'keyFile' && !profile.keyFile) {
        showStatus('Por favor, selecciona un archivo de clave', false);
        return;
      }

      // Guardar perfil
      currentProfiles = await window.sshManager.saveProfile(profile);

      // Actualizar selección y cerrar modal
      selectedProfile = profile;
      closeModal();

      showStatus(`Perfil "${profile.name}" guardado correctamente`, true);
      renderProfileList();
      updateInfoPanel();
    } catch (err) {
      showStatus(`Error al guardar perfil: ${err.message}`, false);
    }
  }

  // Función para conectar SSH
  async function connectSSH() {
    if (!selectedProfile) {
      showStatus('No hay perfil seleccionado', false);
      return;
    }

    const profile = selectedProfile;

    showStatus('Intentando conectar...', true);

    try {
      const result = await window.sshManager.connectSSH(profile);

      if (result.success) {
        showStatus(result.message, true);

        // Habilitar botón de terminal
        openTerminalButton.disabled = false;
        openTerminalButton.classList.remove('hidden');

        // Guardar el nombre del perfil para la terminal
        openTerminalButton.dataset.profileName = profile.name;
      } else {
        showStatus(result.message, false);
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, false);
    }
  }

  // Función para abrir la terminal integrada
  async function openEmbeddedTerminal() {
    if (!selectedProfile) {
      showStatus('No hay perfil seleccionado para abrir terminal', false);
      return;
    }

    const profileName = selectedProfile.name;

    try {
      // Mostrar contenedor de terminal
      terminalContainer.classList.remove('hidden');

      // Inicializar terminal si no existe
      if (!terminal) {
        await initTerminal(profileName);
      }

      // Enfocar la terminal
      if (terminal) {
        terminal.focus();
      }
    } catch (error) {
      showStatus(`Error al abrir terminal: ${error.message}`, false);
      console.error('Error en terminal:', error);
    }
  }

  // Inicializar la terminal xterm.js
  async function initTerminal(profileName) {
    try {
      // Cargar scripts de xterm.js dinámicamente si no están cargados
      await loadTerminalScripts();

      // Crear instancia de terminal
      terminal = new Terminal({
        cursorBlink: true,
        fontSize: terminalFontSize,
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

      // Cargar addon para ajuste automático
      fitAddon = new FitAddon.FitAddon();
      terminal.loadAddon(fitAddon);

      // Abrir terminal en el contenedor
      terminal.open(embeddedTerminal);
      fitAddon.fit();

      // Añadir evento de redimensionamiento
      window.addEventListener('resize', handleTerminalResize);

      // Conectar a SSH
      const result = await window.sshManager.openShell(profileName);

      if (!result.success) {
        showStatus(result.message, false);
        return;
      }

      // Manejar datos de entrada del usuario
      terminal.onData(data => {
        window.sshManager.terminalInput(data);
      });

      // Manejar datos recibidos del servidor
      window.sshManager.onTerminalData((event, data) => {
        if (terminal) {
          if (data && typeof data === 'string') {
            terminal.write(data);
          } else if (data instanceof Uint8Array) {
            terminal.write(new TextDecoder().decode(data));
          }
        }
      });

      // Mensaje de bienvenida
      terminal.write(
        '\r\n\x1b[1;34mTerminal SSH conectada. Presiona Ctrl+C para interrumpir o escribe "exit" para salir.\x1b[0m\r\n'
      );
    } catch (error) {
      console.error('Error al inicializar terminal:', error);
      embeddedTerminal.innerHTML = `<div style="color: red; padding: 20px;">Error al inicializar terminal: ${error.message}</div>`;
    }
  }

  // Cargar scripts de xterm.js dinámicamente
  async function loadTerminalScripts() {
    return new Promise((resolve, reject) => {
      // Verificar si ya están cargados
      if (window.Terminal && window.FitAddon) {
        resolve();
        return;
      }

      try {
        // Cargar xterm.css
        const linkElem = document.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = 'node_modules/xterm/css/xterm.css';
        document.head.appendChild(linkElem);

        // Cargar xterm.js
        const scriptXterm = document.createElement('script');
        scriptXterm.src = 'node_modules/xterm/lib/xterm.js';
        document.body.appendChild(scriptXterm);

        scriptXterm.onload = () => {
          // Cargar addon-fit
          const scriptFit = document.createElement('script');
          scriptFit.src = 'node_modules/xterm-addon-fit/lib/xterm-addon-fit.js';
          document.body.appendChild(scriptFit);

          scriptFit.onload = () => {
            resolve();
          };

          scriptFit.onerror = err => {
            reject(new Error('Error al cargar xterm-addon-fit.js'));
          };
        };

        scriptXterm.onerror = err => {
          reject(new Error('Error al cargar xterm.js'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  // Eliminar perfil
  async function deleteProfile() {
    if (!selectedProfile) return;

    if (confirm(`¿Estás seguro de que quieres eliminar el perfil "${selectedProfile.name}"?`)) {
      try {
        currentProfiles = await window.sshManager.deleteProfile(selectedProfile.name);
        showStatus(`Perfil "${selectedProfile.name}" eliminado`, true);

        // Resetear selección
        selectedProfile = null;
        renderProfileList();
        updateInfoPanel();
      } catch (err) {
        showStatus(`Error al eliminar perfil: ${err.message}`, false);
      }
    }
  }

  // Funciones para controlar la terminal
  function clearTerminal() {
    if (terminal) {
      terminal.clear();
    }
  }

  function increaseTerminalFont() {
    if (!terminal) return;

    if (terminalFontSize < 24) {
      terminalFontSize += 1;
      terminal.setOption('fontSize', terminalFontSize);
      fitAddon.fit();
    }
  }

  function decreaseTerminalFont() {
    if (!terminal) return;

    if (terminalFontSize > 8) {
      terminalFontSize -= 1;
      terminal.setOption('fontSize', terminalFontSize);
      fitAddon.fit();
    }
  }

  function closeTerminal() {
    if (terminal) {
      // Enviar comando de salida o desconectar
      window.sshManager.disconnectSSH(selectedProfile.name);

      // Limpiar terminal
      terminal.dispose();
      terminal = null;

      // Ocultar contenedor
      terminalContainer.classList.add('hidden');

      // Eliminar event listener de resize
      window.removeEventListener('resize', handleTerminalResize);
    }
  }

  function handleTerminalResize() {
    if (fitAddon) {
      fitAddon.fit();
    }
  }

  // Mostrar mensajes de estado
  function showStatus(message, isSuccess) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';

    if (isSuccess) {
      statusMessage.classList.add('status-success');
    } else {
      statusMessage.classList.add('status-error');
    }

    statusMessage.classList.remove('hidden');

    // Ocultar después de 5 segundos
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 5000);
  }
});
