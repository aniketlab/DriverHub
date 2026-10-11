const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanPc: () => ipcRenderer.invoke('scan-pc'),
  onScanStep: (callback) => ipcRenderer.on('scan-step', (_event, value) => callback(value)),
  removeScanStepListener: () => ipcRenderer.removeAllListeners('scan-step'),
  onDeviceMonitorUpdate: (callback) => ipcRenderer.on('device-monitor-update', (_event, value) => callback(value)),
  removeDeviceMonitorListener: () => ipcRenderer.removeAllListeners('device-monitor-update'),
  getConnectedDevices: () => ipcRenderer.invoke('get-connected-devices'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  onLogMessage: (callback) => ipcRenderer.on('log-message', (_event, value) => callback(value)),
});
