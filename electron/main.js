import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanAllDrivers } from './services/scannerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
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
  // Scan PC functionality
  ipcMain.handle('scan-pc', async () => {
    console.log('Backend: Scanning PC for drivers...');
    const results = await scanAllDrivers();
    return results;
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
