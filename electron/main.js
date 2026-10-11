import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAdbStatus, checkDriverStore } from './services/scannerService.js';
import { checkConnectedDevices } from './services/monitorService.js';
import { installAdb, installGoogleDriver, installMtkDriver } from './services/installerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
let mainWindow = null;
let monitorInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#000000',
      height: 35
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startDeviceMonitoring() {
  if (monitorInterval) clearInterval(monitorInterval);
  
  // Poll USB PnP devices every 2.5 seconds
  monitorInterval = setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const devices = await checkConnectedDevices();
      if (devices !== null) {
        mainWindow.webContents.send('device-monitor-update', devices);
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
    await delay(700);
    const adb = await checkAdbStatus();
    sender.send('scan-step', { target: 'adb', state: 'done', data: adb });

    // Step 2: DriverStore for Google and MTK drivers
    sender.send('scan-step', { target: 'google', state: 'scanning' });
    await delay(700);
    const driverStore = await checkDriverStore();
    sender.send('scan-step', { target: 'google', state: 'done', data: driverStore.google });

    // Step 3: MTK drivers
    sender.send('scan-step', { target: 'mtk', state: 'scanning' });
    await delay(600);
    sender.send('scan-step', { target: 'mtk', state: 'done', data: driverStore.mtk });

    return {
      adb,
      google: driverStore.google,
      mtk: driverStore.mtk
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

  ipcMain.handle('run-command', async (event, command) => {
    console.log('Running command:', command);
    return `Executed: ${command}`;
  });

  // 1-Click Driver & Tools Installer
  ipcMain.handle('install-drivers', async (event, targets = ['adb']) => {
    console.log('Backend: Starting installation of targets:', targets);
    const sender = event.sender;
    const results = {};

    if (targets.includes('adb')) {
      try {
        const adbResult = await installAdb(sender);
        results.adb = adbResult;
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

    if (targets.includes('google')) {
      try {
        const googleResult = await installGoogleDriver(sender);
        results.google = googleResult;
      } catch (err) {
        console.error('Google driver install error:', err);
        sender.send('install-step', {
          target: 'google',
          percent: 0,
          error: true,
          message: `Google driver installation failed: ${err.message}`
        });
        results.google = { success: false, error: err.message };
      }
    }

    if (targets.includes('mtk')) {
      try {
        const mtkResult = await installMtkDriver(sender);
        results.mtk = mtkResult;
      } catch (err) {
        console.error('MTK driver install error:', err);
        sender.send('install-step', {
          target: 'mtk',
          percent: 0,
          error: true,
          message: `MTK driver installation failed: ${err.message}`
        });
        results.mtk = { success: false, error: err.message };
      }
    }

    return results;
  });
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();
  startDeviceMonitoring();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (monitorInterval) clearInterval(monitorInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
