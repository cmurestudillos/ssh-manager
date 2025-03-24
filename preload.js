const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sshManager', {
  getProfiles: () => ipcRenderer.invoke('get-ssh-profiles'),
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  toggleFavorite: profileName => ipcRenderer.invoke('toggle-favorite', profileName),
  saveProfile: profile => ipcRenderer.invoke('save-ssh-profile', profile),
  deleteProfile: profileName => ipcRenderer.invoke('delete-ssh-profile', profileName),
  selectKeyFile: () => ipcRenderer.invoke('select-key-file'),
  connectSSH: profile => ipcRenderer.invoke('connect-ssh', profile),
  openShell: profileName => ipcRenderer.invoke('open-shell', profileName),
  disconnectSSH: profileName => ipcRenderer.invoke('disconnect-ssh', profileName),
  terminalInput: data => ipcRenderer.invoke('terminal-input', data),
  onTerminalData: callback => ipcRenderer.on('terminal-data', callback),
});
