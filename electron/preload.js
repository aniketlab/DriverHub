const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanPc: () => ipcRenderer.invoke('scan-pc'),
  onScanStep: (callback) => ipcRenderer.on('scan-step', (_event, value) => callback(value)),
  removeScanStepListener: () => ipcRenderer.removeAllListeners('scan-step'),

  installDrivers: (selectedList) => ipcRenderer.invoke('install-drivers', selectedList),
  onInstallStep: (callback) => ipcRenderer.on('install-step', (_event, value) => callback(value)),
  removeInstallStepListener: () => ipcRenderer.removeAllListeners('install-step'),

  onDeviceMonitorUpdate: (callback) => ipcRenderer.on('device-monitor-update', (_event, value) => callback(value)),
  removeDeviceMonitorListener: () => ipcRenderer.removeAllListeners('device-monitor-update'),
  getConnectedDevices: () => ipcRenderer.invoke('get-connected-devices'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  rebootDevice: (mode) => ipcRenderer.invoke('reboot-device', mode),
  openAdbShell: () => ipcRenderer.invoke('open-adb-shell'),
  openPhoneStorage: (storagePath) => ipcRenderer.invoke('open-phone-storage', storagePath),
  runCommand: (command) => ipcRenderer.invoke('run-command', command),
  onLogMessage: (callback) => ipcRenderer.on('log-message', (_event, value) => callback(value)),

  // Platform Tools APIs
  getPlatformToolsStatus: () => ipcRenderer.invoke('platform-tools:get-status'),
  toggleSystemPath: (enable) => ipcRenderer.invoke('platform-tools:toggle-path', enable),
  toggleAutoUpdate: (enable) => ipcRenderer.invoke('platform-tools:toggle-auto-update', enable),
  changePlatformToolsLocation: () => ipcRenderer.invoke('platform-tools:change-location'),
  reinstallPlatformTools: () => ipcRenderer.invoke('platform-tools:reinstall'),
  controlAdbServer: (action) => ipcRenderer.invoke('platform-tools:server-action', action),
  runTerminalCommand: (command) => ipcRenderer.invoke('platform-tools:run-command', command),

  // Settings & About APIs
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  changeDownloadFolder: () => ipcRenderer.invoke('settings:change-download-folder'),
  openLogsFolder: () => ipcRenderer.invoke('settings:open-logs'),
  openExternalUrl: (url) => ipcRenderer.invoke('settings:open-external', url),
  setWindowTheme: (theme) => ipcRenderer.invoke('settings:set-theme', theme),

  // Windows UAC Elevation APIs
  checkAdmin: () => ipcRenderer.invoke('app:check-admin'),
  relaunchAsAdmin: () => ipcRenderer.invoke('app:relaunch-admin'),
});
