import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkAdbStatus, checkDriverStore } from './services/scannerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
let mainWindow = null;

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
}

function setupIpc() {
  // Staggered Progressive Scan PC with live events
  ipcMain.handle('scan-pc', async (event) => {
    console.log('Backend: Starting progressive hardware scan...');
    const sender = event.sender;

    // Helper for natural UX pacing
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // Step 1: Scan ADB Platform Tools
    sender.send('scan-step', { target: 'adb', state: 'scanning' });
    await delay(700);
    const adb = await checkAdbStatus();
    sender.send('scan-step', { target: 'adb', state: 'done', data: adb });

    // Step 2: Query DriverStore for Google and MTK drivers
    sender.send('scan-step', { target: 'google', state: 'scanning' });
    await delay(700);
    const driverStore = await checkDriverStore();
    sender.send('scan-step', { target: 'google', state: 'done', data: driverStore.google });

    // Step 3: Report MTK driver status
    sender.send('scan-step', { target: 'mtk', state: 'scanning' });
    await delay(600);
    sender.send('scan-step', { target: 'mtk', state: 'done', data: driverStore.mtk });

    return {
      adb,
      google: driverStore.google,
      mtk: driverStore.mtk
    };
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
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
