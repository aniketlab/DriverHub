import { app, BrowserWindow, ipcMain, shell, dialog, Tray, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { checkAdbStatus, checkDriverStore } from './services/scannerService.js';
import { checkConnectedDevices } from './services/monitorService.js';
import { installAdb, installGoogleDriver, installMtkDriver, createSystemRestorePoint } from './services/installerService.js';
import { syncDeviceDatabase } from './services/deviceSyncService.js';
import { rebootDevice, openAdbShell, openPhoneStorage } from './services/deviceActionService.js';
import { 
  getPlatformToolsDetails, 
  toggleSystemPath, 
  toggleAutoUpdate, 
  setPlatformToolsDir, 
  handleAdbServerAction, 
  executeTerminalCommand 
} from './services/platformToolsService.js';
import { 
  loadSettings, 
  saveSettings, 
  resetSettingsToDefault, 
  selectDownloadFolder, 
  openLogsFolderInExplorer, 
  isUserAdmin,
  showConnectionNotification 
} from './services/settingsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
let mainWindow = null;
let monitorInterval = null;
let tray = null;
let isQuitting = false;
let lastConnectedState = false;
let lastConnectedModel = null;

function createTray() {
  const iconPath = path.join(__dirname, '../public/logo/driverhub_app_icon_squircle.png');
  if (fs.existsSync(iconPath)) {
    try {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        { 
          label: 'Open Driver Hub', 
          click: () => { 
            if (mainWindow) {
              mainWindow.show(); 
              mainWindow.focus(); 
            }
          } 
        },
        { type: 'separator' },
        { 
          label: 'Quit', 
          click: () => { 
            isQuitting = true; 
            app.quit(); 
          } 
        }
      ]);
      tray.setToolTip('Driver Hub');
      tray.setContextMenu(contextMenu);
      tray.on('double-click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
    } catch (e) {
      console.warn('Tray init warning:', e.message);
    }
  }
}

function createWindow() {
  const currentSettings = loadSettings();
  const isDark = currentSettings.theme === 'dark';

  mainWindow = new BrowserWindow({
    width: 1050,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../public/logo/driverhub_app_icon_squircle.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: isDark ? '#090d16' : '#ffffff',
      symbolColor: isDark ? '#f8fafc' : '#1e293b',
      height: 38
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    const settings = loadSettings();
    if (!isQuitting && settings.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startDeviceMonitoring() {
  if (monitorInterval) clearInterval(monitorInterval);
  
  // Poll USB PnP devices every 2.5 seconds
  monitorInterval = setInterval(async () => {
    const settings = loadSettings();
    if (!settings.autoDetectDevices) return;

    if (mainWindow && !mainWindow.isDestroyed()) {
      const devices = await checkConnectedDevices();
      if (devices !== null) {
        mainWindow.webContents.send('device-monitor-update', devices);

        // Check for device connection transitions for notifications
        if (devices.connected && !lastConnectedState) {
          showConnectionNotification(devices.model, true);
        } else if (!devices.connected && lastConnectedState) {
          showConnectionNotification(lastConnectedModel, false);
        }
        lastConnectedState = Boolean(devices.connected);
        if (devices.connected && devices.model) {
          lastConnectedModel = devices.model;
        }
      }
    }
  }, 2500);
}

function setupIpc() {
  // Staggered Progressive Scan PC
  ipcMain.handle('scan-pc', async (event) => {
    console.log('Backend: Starting progressive hardware scan...');
    const sender = event.sender;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // Step 1: ADB Platform Tools
    sender.send('scan-step', { target: 'adb', state: 'scanning' });
    await delay(350);
    const adb = await checkAdbStatus();
    sender.send('scan-step', { target: 'adb', state: 'done', data: adb });

    // Step 2: DriverStore for Google and MTK drivers
    sender.send('scan-step', { target: 'google', state: 'scanning' });
    sender.send('scan-step', { target: 'google_usb', state: 'scanning' });
    sender.send('scan-step', { target: 'google_bootloader', state: 'scanning' });
    await delay(400);
    const driverStore = await checkDriverStore();
    sender.send('scan-step', { target: 'google', state: 'done', data: driverStore.google });
    if (driverStore.packages) {
      sender.send('scan-step', { target: 'google_usb', state: 'done', data: driverStore.packages.google_usb });
      sender.send('scan-step', { target: 'google_bootloader', state: 'done', data: driverStore.packages.google_bootloader });
    }

    // Step 3: MTK drivers
    sender.send('scan-step', { target: 'mtk', state: 'scanning' });
    sender.send('scan-step', { target: 'mtk_vcom', state: 'scanning' });
    sender.send('scan-step', { target: 'mtk_brom', state: 'scanning' });
    await delay(300);
    sender.send('scan-step', { target: 'mtk', state: 'done', data: driverStore.mtk });
    if (driverStore.packages) {
      sender.send('scan-step', { target: 'mtk_vcom', state: 'done', data: driverStore.packages.mtk_vcom });
      sender.send('scan-step', { target: 'mtk_brom', state: 'done', data: driverStore.packages.mtk_brom });
    }

    return {
      adb,
      google: driverStore.google,
      mtk: driverStore.mtk,
      packages: driverStore.packages
    };
  });

  // Get current device status immediately
  ipcMain.handle('get-connected-devices', async () => {
    return await checkConnectedDevices();
  });

  // Open folder in Windows File Explorer
  ipcMain.handle('open-folder', async (event, folderPath) => {
    if (folderPath) {
      console.log('Backend: Opening folder ->', folderPath);
      await shell.openPath(folderPath);
    }
  });

  // Device hardware actions
  ipcMain.handle('reboot-device', async (event, mode) => {
    return await rebootDevice(mode);
  });

  ipcMain.handle('open-adb-shell', async () => {
    return await openAdbShell();
  });

  ipcMain.handle('open-phone-storage', async (event, storagePath) => {
    return await openPhoneStorage(storagePath);
  });

  ipcMain.handle('run-command', async (event, command) => {
    console.log('Running command:', command);
    return `Executed: ${command}`;
  });

  // Platform Tools Hub IPC Handlers
  ipcMain.handle('platform-tools:get-status', async () => {
    return await getPlatformToolsDetails();
  });

  ipcMain.handle('platform-tools:toggle-path', async (event, enable) => {
    return await toggleSystemPath(enable);
  });

  ipcMain.handle('platform-tools:toggle-auto-update', async (event, enable) => {
    return toggleAutoUpdate(enable);
  });

  ipcMain.handle('platform-tools:change-location', async () => {
    if (!mainWindow) return { success: false };
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Android Platform-Tools Directory',
      properties: ['openDirectory'],
      buttonLabel: 'Select Folder'
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return setPlatformToolsDir(res.filePaths[0]);
    }
    return { canceled: true };
  });

  ipcMain.handle('platform-tools:reinstall', async (event) => {
    const sender = event.sender;
    return await installAdb(sender);
  });

  ipcMain.handle('platform-tools:server-action', async (event, action) => {
    return await handleAdbServerAction(action);
  });

  ipcMain.handle('platform-tools:run-command', async (event, command) => {
    return await executeTerminalCommand(command);
  });

  // Settings & About Hub IPC Handlers
  ipcMain.handle('settings:get', () => {
    const settings = loadSettings();
    return {
      ...settings,
      isAdmin: isUserAdmin(),
      version: '1.0.0',
      platform: 'Windows 10 / 11, 64-bit'
    };
  });

  ipcMain.handle('settings:save', (event, newSettings) => {
    return saveSettings(newSettings);
  });

  ipcMain.handle('settings:reset', () => {
    return resetSettingsToDefault();
  });

  ipcMain.handle('settings:change-download-folder', async () => {
    return await selectDownloadFolder(mainWindow);
  });

  ipcMain.handle('settings:open-logs', async () => {
    return await openLogsFolderInExplorer();
  });

  ipcMain.handle('settings:open-external', async (event, url) => {
    if (url && typeof url === 'string') {
      await shell.openExternal(url);
    }
  });

  ipcMain.handle('settings:set-theme', (event, theme) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isDark = theme === 'dark';
      try {
        mainWindow.setTitleBarOverlay({
          color: isDark ? '#090d16' : '#ffffff',
          symbolColor: isDark ? '#f8fafc' : '#1e293b'
        });
      } catch {}
    }
    return { success: true };
  });

  // 1-Click Driver & Tools Installer with System Restore Support
  ipcMain.handle('install-drivers', async (event, payload = ['adb']) => {
    let targets = [];
    let createRestorePoint = false;

    if (Array.isArray(payload)) {
      targets = payload;
    } else if (payload && typeof payload === 'object') {
      targets = payload.targets || [];
      createRestorePoint = Boolean(payload.createRestorePoint);
    }

    console.log('Backend: Starting installation of targets:', targets, 'createRestorePoint:', createRestorePoint);
    const sender = event.sender;
    const results = {};

    if (createRestorePoint) {
      try {
        await createSystemRestorePoint(sender);
      } catch (err) {
        console.warn('Restore point creation failed:', err);
      }
    }

    if (targets.includes('adb')) {
      try {
        results.adb = await installAdb(sender);
      } catch (err) {
        console.error('ADB install error:', err);
        sender.send('install-step', {
          target: 'adb',
          percent: 0,
          error: true,
          message: `ADB installation failed: ${err.message}`
        });
        results.adb = { success: false, error: err.message };
      }
    }

    if (targets.includes('google_usb') || targets.includes('google')) {
      try {
        results.google_usb = await installGoogleDriver(sender, 'usb');
      } catch (err) {
        console.error('Google USB driver install error:', err);
        sender.send('install-step', {
          target: 'google_usb',
          percent: 0,
          error: true,
          message: `Google USB driver install failed: ${err.message}`
        });
        results.google_usb = { success: false, error: err.message };
      }
    }

    if (targets.includes('google_bootloader') || (targets.includes('google') && !targets.includes('google_usb'))) {
      try {
        results.google_bootloader = await installGoogleDriver(sender, 'bootloader');
      } catch (err) {
        console.error('Google Bootloader install error:', err);
        sender.send('install-step', {
          target: 'google_bootloader',
          percent: 0,
          error: true,
          message: `Google Bootloader install failed: ${err.message}`
        });
        results.google_bootloader = { success: false, error: err.message };
      }
    }

    if (targets.includes('mtk_vcom') || targets.includes('mtk')) {
      try {
        results.mtk_vcom = await installMtkDriver(sender, 'vcom');
      } catch (err) {
        console.error('MTK VCOM install error:', err);
        sender.send('install-step', {
          target: 'mtk_vcom',
          percent: 0,
          error: true,
          message: `MTK VCOM install failed: ${err.message}`
        });
        results.mtk_vcom = { success: false, error: err.message };
      }
    }

    if (targets.includes('mtk_brom') || (targets.includes('mtk') && !targets.includes('mtk_vcom'))) {
      try {
        results.mtk_brom = await installMtkDriver(sender, 'brom');
      } catch (err) {
        console.error('MTK BROM install error:', err);
        sender.send('install-step', {
          target: 'mtk_brom',
          percent: 0,
          error: true,
          message: `MTK BROM install failed: ${err.message}`
        });
        results.mtk_brom = { success: false, error: err.message };
      }
    }

    return results;
  });
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();
  createTray();
  startDeviceMonitoring();

  // Background non-blocking sync for newly released smartphones (5s delay)
  setTimeout(() => {
    syncDeviceDatabase();
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (monitorInterval) clearInterval(monitorInterval);
  const settings = loadSettings();
  if (!settings.minimizeToTray || isQuitting) {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
