document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM - Panel de lista
  const profileList = document.getElementById('profileList');
  const allTab = document.getElementById('allTab');
  const favoritesTab = document.getElementById('favoritesTab');
  const newProfileButton = document.getElementById('newProfileButton');
  const welcomeNewButton = document.getElementById('welcomeNewButton');

  // Referencias a elementos del DOM - Panel de información
  const infoPanel = document.getElementById('infoPanel');
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

  let currentProfiles = [];
  let favorites = [];
  let selectedProfile = null;
  let activeTab = 'all'; // 'all' o 'favorites'
  let isNewProfile = false; // Para controlar si estamos creando un nuevo perfil

  // Cargar perfiles y favoritos
  loadProfiles();

  // Event Listeners - Pestañas y botones principales
  allTab.addEventListener('click', () => switchTab('all'));
  favoritesTab.addEventListener('click', () => switchTab('favorites'));
  newProfileButton.addEventListener('click', createNewProfile);
  welcomeNewButton.addEventListener('click', createNewProfile);

  // Event Listeners - Acciones de perfil
  connectButton.addEventListener('click', connectSSH);
  openTerminalButton.addEventListener('click', openTerminal);
  editButton.addEventListener('click', editProfile);
  deleteButton.addEventListener('click', deleteProfile);

  // Event Listeners - Modal
  modalAuthType.addEventListener('change', updateModalAuthFields);
  modalBrowseKeyFile.addEventListener('click', selectKeyFile);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveProfile);

  // Funciones
  async function loadProfiles() {
    try {
      currentProfiles = await window.sshManager.getProfiles();
      favorites = await window.sshManager.getFavorites();
      renderProfileList();
      updateInfoPanel();
    } catch (err) {
      showStatus(`Error al cargar perfiles: ${err.message}`, false);
    }
  }

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

  function createNewProfile() {
    isNewProfile = true;
    modalTitle.textContent = 'Nueva Conexión';

    // Limpiar formulario
    clearModalForm();

    // Mostrar modal
    openModal();
  }

  function editProfile() {
    if (!selectedProfile) return;

    isNewProfile = false;
    modalTitle.textContent = 'Editar Conexión';

    // Llenar formulario con datos del perfil
    fillModalForm(selectedProfile);

    // Mostrar modal
    openModal();
  }

  function openModal() {
    profileModal.classList.add('active');
  }

  function closeModal() {
    profileModal.classList.remove('active');
  }

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

  function switchTab(tab) {
    activeTab = tab;

    // Actualizar clases CSS
    if (tab === 'all') {
      allTab.classList.add('active');
      favoritesTab.classList.remove('active');
    } else {
      allTab.classList.remove('active');
      favoritesTab.classList.add('active');
    }

    renderProfileList();
  }

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
      profileList.innerHTML =
        activeTab === 'all' ? '<li>No hay perfiles guardados</li>' : '<li>No hay perfiles favoritos</li>';
      return;
    }

    profilesToShow.forEach(profile => {
      const li = document.createElement('li');
      li.className = 'profile-item';
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

  function selectProfile(profile) {
    selectedProfile = profile;

    // Actualizar UI para mostrar perfil seleccionado
    renderProfileList();
    updateInfoPanel();
  }

  async function selectKeyFile() {
    const filePath = await window.sshManager.selectKeyFile();
    if (filePath) {
      modalKeyFile.value = filePath;
    }
  }

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

  async function connectSSH() {
    if (!selectedProfile) return;

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
      showStatus(error.message, false);
    }
  }

  // Función para abrir la terminal
  async function openTerminal() {
    const profileName = openTerminalButton.dataset.profileName;

    if (!profileName) {
      showStatus('No hay perfil seleccionado para abrir terminal', false);
      return;
    }

    try {
      const result = await window.sshManager.openShell(profileName);
      if (!result.success) {
        showStatus(result.message, false);
      }
    } catch (error) {
      showStatus(`Error al abrir terminal: ${error.message}`, false);
    }
  }

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
document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const profileList = document.getElementById('profileList');
  const sshForm = document.getElementById('sshForm');
  const profileNameInput = document.getElementById('profileName');
  const hostInput = document.getElementById('host');
  const portInput = document.getElementById('port');
  const usernameInput = document.getElementById('username');
  const authTypeSelect = document.getElementById('authType');
  const passwordGroup = document.getElementById('passwordGroup');
  const passwordInput = document.getElementById('password');
  const keyFileGroup = document.getElementById('keyFileGroup');
  const keyFileInput = document.getElementById('keyFile');
  const passphraseGroup = document.getElementById('passphraseGroup');
  const passphraseInput = document.getElementById('passphrase');
  const browseKeyFileButton = document.getElementById('browseKeyFile');
  const saveButton = document.getElementById('saveButton');
  const connectButton = document.getElementById('connectButton');
  const deleteButton = document.getElementById('deleteButton');
  const statusMessage = document.getElementById('statusMessage');
  const allTab = document.getElementById('allTab');
  const favoritesTab = document.getElementById('favoritesTab');
  const formPanel = document.getElementById('formPanel');
  const welcomePanel = document.getElementById('welcomePanel');
  const formTitle = document.getElementById('formTitle');
  const newProfileButton = document.getElementById('newProfileButton');
  const welcomeNewButton = document.getElementById('welcomeNewButton');

  // Crear elemento del botón si no existe
  let openTerminalButton = document.getElementById('openTerminalButton');
  if (!openTerminalButton) {
    openTerminalButton = document.createElement('button');
    openTerminalButton.id = 'openTerminalButton';
    openTerminalButton.className = 'terminal hidden';
    openTerminalButton.disabled = true;
    openTerminalButton.textContent = 'Abrir Terminal';

    // Insertarlo después del botón connectButton
    connectButton.parentNode.insertBefore(openTerminalButton, connectButton.nextSibling);
  }

  let currentProfiles = [];
  let favorites = [];
  let selectedProfile = null;
  let activeTab = 'all'; // 'all' o 'favorites'
  let isNewProfile = false; // Para controlar si estamos creando un nuevo perfil

  // Cargar perfiles y favoritos
  loadProfiles();

  // Mostrar/ocultar paneles iniciales
  updatePanelVisibility();

  // Event Listeners
  authTypeSelect.addEventListener('change', updateAuthFields);
  browseKeyFileButton.addEventListener('click', selectKeyFile);
  saveButton.addEventListener('click', saveProfile);
  connectButton.addEventListener('click', connectSSH);
  deleteButton.addEventListener('click', deleteProfile);
  openTerminalButton.addEventListener('click', openTerminal);

  // Eventos para pestañas
  allTab.addEventListener('click', () => switchTab('all'));
  favoritesTab.addEventListener('click', () => switchTab('favorites'));

  // Eventos para botones de nueva conexión
  newProfileButton.addEventListener('click', createNewProfile);
  welcomeNewButton.addEventListener('click', createNewProfile);

  // Funciones
  async function loadProfiles() {
    try {
      currentProfiles = await window.sshManager.getProfiles();
      favorites = await window.sshManager.getFavorites();
      renderProfileList();
    } catch (err) {
      showStatus(`Error al cargar perfiles: ${err.message}`, false);
    }
  }

  function updatePanelVisibility() {
    if (selectedProfile || isNewProfile) {
      formPanel.style.display = 'block';
      welcomePanel.style.display = 'none';

      // Actualizar título del formulario
      formTitle.textContent = isNewProfile ? 'Nueva Conexión' : 'Editar Conexión';
    } else {
      formPanel.style.display = 'none';
      welcomePanel.style.display = 'flex';
    }
  }

  function createNewProfile() {
    // Limpiar el formulario
    sshForm.reset();
    selectedProfile = null;
    isNewProfile = true;

    // Activar valores por defecto
    portInput.value = '22';
    authTypeSelect.value = 'password';
    updateAuthFields();

    // Habilitar/deshabilitar botones
    deleteButton.disabled = true;

    // Actualizar UI
    updatePanelVisibility();
    renderProfileList();
  }

  function switchTab(tab) {
    activeTab = tab;

    // Actualizar clases CSS
    if (tab === 'all') {
      allTab.classList.add('active');
      favoritesTab.classList.remove('active');
    } else {
      allTab.classList.remove('active');
      favoritesTab.classList.add('active');
    }

    renderProfileList();
  }

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
      profileList.innerHTML =
        activeTab === 'all' ? '<li>No hay perfiles guardados</li>' : '<li>No hay perfiles favoritos</li>';
      return;
    }

    profilesToShow.forEach(profile => {
      const li = document.createElement('li');
      li.className = 'profile-item';
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

  function selectProfile(profile) {
    selectedProfile = profile;
    isNewProfile = false;

    // Actualizar el formulario con los datos del perfil
    profileNameInput.value = profile.name;
    hostInput.value = profile.host;
    portInput.value = profile.port || 22;
    usernameInput.value = profile.username;
    authTypeSelect.value = profile.authType || 'password';

    if (profile.authType === 'password') {
      passwordInput.value = profile.password || '';
      keyFileInput.value = '';
      passphraseInput.value = '';
    } else {
      passwordInput.value = '';
      keyFileInput.value = profile.keyFile || '';
      passphraseInput.value = profile.passphrase || '';
    }

    updateAuthFields();
    renderProfileList();
    deleteButton.disabled = false;

    // Mostrar panel de formulario
    updatePanelVisibility();
  }

  function updateAuthFields() {
    const authType = authTypeSelect.value;

    if (authType === 'password') {
      passwordGroup.classList.remove('hidden');
      keyFileGroup.classList.add('hidden');
      passphraseGroup.classList.add('hidden');
    } else {
      // keyFile
      passwordGroup.classList.add('hidden');
      keyFileGroup.classList.remove('hidden');
      passphraseGroup.classList.remove('hidden');
    }
  }

  async function selectKeyFile() {
    const filePath = await window.sshManager.selectKeyFile();
    if (filePath) {
      keyFileInput.value = filePath;
    }
  }

  async function saveProfile() {
    try {
      const profile = {
        name: profileNameInput.value,
        host: hostInput.value,
        port: parseInt(portInput.value) || 22,
        username: usernameInput.value,
        authType: authTypeSelect.value,
      };

      if (profile.authType === 'password') {
        profile.password = passwordInput.value;
      } else {
        profile.keyFile = keyFileInput.value;
        profile.passphrase = passphraseInput.value;
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
      selectedProfile = profile;
      isNewProfile = false;

      showStatus(`Perfil "${profile.name}" guardado correctamente`, true);
      renderProfileList();
      deleteButton.disabled = false;

      // Actualizar UI
      updatePanelVisibility();
    } catch (err) {
      showStatus(`Error al guardar perfil: ${err.message}`, false);
    }
  }

  async function connectSSH() {
    // Recoger datos del formulario
    const profile = {
      name: profileNameInput.value,
      host: hostInput.value,
      port: parseInt(portInput.value) || 22,
      username: usernameInput.value,
      authType: authTypeSelect.value,
    };

    if (profile.authType === 'password') {
      profile.password = passwordInput.value;
    } else {
      profile.keyFile = keyFileInput.value;
      profile.passphrase = passphraseInput.value;
    }

    // Validar campos requeridos
    if (!profile.host || !profile.username) {
      showStatus('Por favor, rellena host y usuario', false);
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

    showStatus('Intentando conectar...', true);

    try {
      const result = await window.sshManager.connectSSH(profile);

      if (result.success) {
        showStatus(result.message, true);

        // Asegurarnos de que el botón existe antes de intentar modificarlo
        if (openTerminalButton) {
          openTerminalButton.disabled = false;
          openTerminalButton.classList.remove('hidden');

          // Guardar el nombre del perfil para la terminal
          openTerminalButton.dataset.profileName = profile.name;
        } else {
          console.error('No se encuentra el botón openTerminalButton');
          showStatus('Conexión establecida, pero hay un problema con la interfaz', true);
        }
      } else {
        showStatus(result.message, false);
      }
    } catch (error) {
      showStatus(error.message, false);
    }
  }

  // Función para abrir la terminal
  async function openTerminal() {
    const profileName = openTerminalButton.dataset.profileName;

    if (!profileName) {
      showStatus('No hay perfil seleccionado para abrir terminal', false);
      return;
    }

    try {
      const result = await window.sshManager.openShell(profileName);
      if (!result.success) {
        showStatus(result.message, false);
      }
    } catch (error) {
      showStatus(`Error al abrir terminal: ${error.message}`, false);
    }
  }

  async function deleteProfile() {
    if (!selectedProfile) return;

    if (confirm(`¿Estás seguro de que quieres eliminar el perfil "${selectedProfile.name}"?`)) {
      try {
        currentProfiles = await window.sshManager.deleteProfile(selectedProfile.name);
        showStatus(`Perfil "${selectedProfile.name}" eliminado`, true);

        // Limpiar formulario
        sshForm.reset();
        selectedProfile = null;
        isNewProfile = false;
        deleteButton.disabled = true;
        renderProfileList();

        // Ocultar panel de formulario y mostrar bienvenida
        updatePanelVisibility();
      } catch (err) {
        showStatus(`Error al eliminar perfil: ${err.message}`, false);
      }
    }
  }

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

  // Inicializar la UI
  updateAuthFields();
});
