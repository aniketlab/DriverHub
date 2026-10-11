import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { resolveDevice } from '../data/deviceDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

const SCRIPT_DIR = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'scripts');
const stagedScriptPath = path.join(SCRIPT_DIR, 'detectDevices.ps1');

function getScriptPath() {
  const bundled = path.join(__dirname, 'detectDevices.ps1');
  try {
    if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
    if (fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, stagedScriptPath);
      return stagedScriptPath;
    }
  } catch {}

  if (fs.existsSync(stagedScriptPath)) return stagedScriptPath;

  if (process.resourcesPath) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'services', 'detectDevices.ps1');
    if (fs.existsSync(unpacked)) {
      try { fs.copyFileSync(unpacked, stagedScriptPath); return stagedScriptPath; } catch {}
      return unpacked;
    }
  }
  return bundled;
}

let isChecking = false;

// Dynamically discover candidate ADB executable paths
function getAdbExecutable() {
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe'),
    path.join(__dirname, '..', 'bin', 'platform-tools', 'adb.exe'),
    'C:\\platform-tools-latest-windows\\adb.exe',
    path.join(os.homedir(), 'Downloads', 'platform-tools', 'adb.exe'),
    path.join(os.homedir(), 'Downloads', 'Programs', 'POCO M7 Plus', 'platform-tools', 'adb.exe'),
  ];

  if (process.resourcesPath) {
    candidates.push(
      path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'bin', 'platform-tools', 'adb.exe'),
      path.join(process.resourcesPath, 'electron', 'bin', 'platform-tools', 'adb.exe')
    );
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return `"${c}"`;
    }
  }
  return 'adb';
}

// Ultra-fast direct ADB query (< 50ms)
async function checkAdbDirect() {
  try {
    const adbCmd = getAdbExecutable();
    const { stdout } = await execPromise(`${adbCmd} devices -l`, { timeout: 1500 });
    const lines = stdout.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('List of') || trimmed.startsWith('*')) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const serial = parts[0];
        const state = parts[1]; // 'device', 'unauthorized', 'offline'

        if (state === 'device' || state === 'unauthorized') {
          let rawModel = null;
          const modelMatch = trimmed.match(/model:([^\s]+)/);
          const productMatch = trimmed.match(/product:([^\s]+)/);

          if (modelMatch) {
            rawModel = modelMatch[1].replace(/_/g, ' ');
          } else if (productMatch) {
            rawModel = productMatch[1].replace(/_/g, ' ');
          }

          let brand = null;
          if (rawModel) {
            if (/redmi|xiaomi|poco/i.test(rawModel)) brand = 'Xiaomi';
            else if (/moto/i.test(rawModel)) brand = 'Motorola';
            else if (/oneplus/i.test(rawModel)) brand = 'OnePlus';
            else if (/galaxy|sm-/i.test(rawModel)) brand = 'Samsung';
            else if (/pixel/i.test(rawModel)) brand = 'Google';
          }

          const resolved = resolveDevice(rawModel || serial, brand);

          return {
            connected: true,
            adb: true,
            fastboot: false,
            mtk: false,
            mtp: false,
            mode: 'ADB Debugging',
            brand: resolved.brand || brand || 'Android',
            model: resolved.model || rawModel || 'Android Device',
            rawModel: rawModel || serial
          };
        }
      }
    }
  } catch (err) {
    // ADB command not found or no devices
  }
  return null;
}

export async function checkConnectedDevices() {
  if (isChecking) {
    return null; // Avoid overlapping executions
  }
  isChecking = true;

  try {
    // Tier 1: Check native ADB daemon directly (< 50ms, 100% accurate)
    const directAdbResult = await checkAdbDirect();
    if (directAdbResult) {
      return directAdbResult;
    }

    // Tier 2: Query Windows USB PnP (For Fastboot, MTK BROM, Preloader, VCOM, MTP, Charging)
    const effectiveScript = getScriptPath();
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${effectiveScript}"`;
    const { stdout } = await execPromise(cmd, { timeout: 5000 });
    
    const trimmed = stdout.trim();
    if (!trimmed) {
      return { 
        connected: false, 
        adb: false, 
        fastboot: false, 
        mtk: false, 
        mtp: false,
        brand: null, 
        model: null, 
        mode: null 
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { connected: false, adb: false, fastboot: false, mtk: false, mtp: false, brand: null, model: null, mode: null };
    }

    const deviceList = parsed.Devices || [];
    let hasAdb = false;
    let hasFastboot = false;
    let hasMtk = false;
    let hasMtp = false;
    let hasUsbPhysical = false;

    for (const item of deviceList) {
      const name = (item.FriendlyName || '').toLowerCase();
      const id = (item.InstanceId || '').toLowerCase();
      const pnpClass = (item.PNPClass || '').toLowerCase();

      // 1. Check Fastboot / Bootloader
      if (name.includes('bootloader') || name.includes('fastboot') || id.includes('pid_d00d') || id.includes('pid_4ee0')) {
        hasFastboot = true;
        hasUsbPhysical = true;
      } 
      // 2. Check MTK BROM / Preloader / VCOM
      else if (name.includes('preloader') || name.includes('vcom') || id.includes('vid_0e8d') || name.includes('mediatek')) {
        hasMtk = true;
        hasUsbPhysical = true;
      } 
      // 3. Check ADB (ONLY if interface name actually contains 'adb' or class is AndroidUsbDeviceClass without bootloader)
      else if (name.includes('adb') || (pnpClass === 'androidusbdeviceclass' && !name.includes('bootloader') && !name.includes('fastboot'))) {
        hasAdb = true;
        hasUsbPhysical = true;
      }
      // 4. Check File Transfer / MTP (WPD class or MTP description)
      else if (pnpClass === 'wpd' || name.includes('mtp') || id.includes('ms_comp_mtp')) {
        hasMtp = true;
        hasUsbPhysical = true;
      }
      // 5. Generic physical USB phone connection (Motorola, Xiaomi, OnePlus, Samsung, Google, Vivo, etc.)
      else if (id.match(/vid_(22b8|2717|22d9|2a70|04e8|18d1|2b4b|19d2|2e04|12d1|0e8d)/i)) {
        hasUsbPhysical = true;
      }
    }

    const isConnected = hasUsbPhysical || hasAdb || hasFastboot || hasMtk || hasMtp || !!parsed.Model;

    let detectedMode = 'USB Connected';
    if (hasFastboot) {
      detectedMode = 'Fastboot Mode';
    } else if (hasMtk) {
      detectedMode = 'MediaTek BROM / Preloader';
    } else if (hasAdb) {
      detectedMode = 'ADB Debugging';
    } else if (hasMtp) {
      detectedMode = 'File Transfer (MTP)';
    } else if (isConnected) {
      detectedMode = 'USB Connected';
    }

    const rawModel = parsed.Model || null;
    const resolved = resolveDevice(rawModel, parsed.Brand);

    return {
      connected: isConnected,
      adb: hasAdb,
      fastboot: hasFastboot,
      mtk: hasMtk,
      mtp: hasMtp,
      mode: isConnected ? detectedMode : null,
      brand: resolved.brand || (isConnected ? (parsed.Brand || 'Android') : null),
      model: resolved.model || parsed.Model,
      rawModel: rawModel
    };
  } catch (err) {
    console.error('Device monitor error:', err.message);
    return { connected: false, adb: false, fastboot: false, mtk: false, brand: null, model: null, mode: null };
  } finally {
    isChecking = false;
  }
}
