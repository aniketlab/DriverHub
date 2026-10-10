const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanPc: () => ipcRenderer.invoke('scan-pc'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  onLogMessage: (callback) => ipcRenderer.on('log-message', (_event, value) => callback(value)),
});
