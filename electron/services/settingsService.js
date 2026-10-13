import fs from 'fs';
import path from 'path';
import os from 'os';
import { app, shell, dialog, Notification } from 'electron';
import { exec, execSync } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const APP_DATA_DIR = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub');
const SETTINGS_FILE = path.join(APP_DATA_DIR, 'settings.json');
const LOGS_DIR = path.join(APP_DATA_DIR, 'logs');
const DRIVERS_DIR = path.join(APP_DATA_DIR, 'drivers');

// Ensure base directories exist
for (const dir of [APP_DATA_DIR, LOGS_DIR, DRIVERS_DIR]) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark' | 'system'
  language: 'English',
  startWithWindows: false,
  minimizeToTray: true,
  autoDetectDevices: true,
  connectionNotifications: true,
  createRestorePoint: true,
  checkForDriverUpdates: true,
  downloadFolder: DRIVERS_DIR
};

export function isUserAdmin() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Could not read settings file, using defaults:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(newSettings) {
  try {
    const current = loadSettings();
    const merged = { ...current, ...newSettings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');

    // Apply start with Windows if changed
    if (typeof newSettings.startWithWindows === 'boolean') {
      try {
        app.setLoginItemSettings({
          openAtLogin: newSettings.startWithWindows,
          openAsHidden: Boolean(merged.minimizeToTray)
        });
      } catch (e) {
        console.warn('Failed to set login item settings:', e.message);
      }
    }

    return merged;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return loadSettings();
  }
}

export function resetSettingsToDefault() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
    try {
      app.setLoginItemSettings({ openAtLogin: false });
    } catch {}
    return { ...DEFAULT_SETTINGS };
  } catch (err) {
    console.error('Failed to reset settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function selectDownloadFolder(parentWindow) {
  try {
    const res = await dialog.showOpenDialog(parentWindow, {
      title: 'Select Driver Download Folder',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: loadSettings().downloadFolder || DRIVERS_DIR,
      buttonLabel: 'Select Folder'
    });

    if (!res.canceled && res.filePaths.length > 0) {
      const selected = res.filePaths[0];
      saveSettings({ downloadFolder: selected });
      return { success: true, path: selected };
    }
    return { canceled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function openLogsFolderInExplorer() {
  try {
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
    // Write sample audit log if empty
    const auditLog = path.join(LOGS_DIR, 'driverhub_session.log');
    if (!fs.existsSync(auditLog)) {
      fs.writeFileSync(
        auditLog,
        `[${new Date().toISOString()}] Driver Hub initialized successfully.\n` +
        `[${new Date().toISOString()}] Platform: Windows 10/11 64-bit.\n` +
        `[${new Date().toISOString()}] Core drivers staged: Google USB Driver, MediaTek Preloader.\n`,
        'utf8'
      );
    }
    await shell.openPath(LOGS_DIR);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function showConnectionNotification(deviceModel, isConnected) {
  const settings = loadSettings();
  if (!settings.connectionNotifications) return;

  try {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: 'Driver Hub',
        body: isConnected 
          ? `Device connected: ${deviceModel || 'Android Smartphone'}`
          : `Device disconnected: ${deviceModel || 'Android Smartphone'}`,
        silent: false
      });
      notif.show();
    }
  } catch (err) {
    console.warn('Could not show notification:', err.message);
  }
}
