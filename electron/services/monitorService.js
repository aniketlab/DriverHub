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

const scriptPath = path.join(__dirname, 'detectDevices.ps1');

let isChecking = false;

// Dynamically discover candidate ADB executable paths
function getAdbExecutable() {
  const candidates = [
    'C:\\platform-tools-latest-windows\\adb.exe',
    path.join(os.homedir(), 'Downloads', 'platform-tools', 'adb.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe'),
    path.join(os.homedir(), 'Downloads', 'Programs', 'POCO M7 Plus', 'platform-tools', 'adb.exe'),
  ];

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
            mode: 'ADB',
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

    // Tier 2: Query Windows USB PnP (For Fastboot, MTK BROM, Preloader, VCOM)
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    const { stdout } = await execPromise(cmd, { timeout: 5000 });
    
    const trimmed = stdout.trim();
    if (!trimmed) {
      return { 
        connected: false,
        adb: false, 
        fastboot: false, 
        mtk: false, 
        brand: null, 
        model: null,
        mode: null
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { connected: false, adb: false, fastboot: false, mtk: false, brand: null, model: null, mode: null };
    }

    const deviceList = parsed.Devices || [];
    let hasAdb = false;
    let hasFastboot = false;
    let hasMtk = false;
    let detectedMode = null;

    for (const item of deviceList) {
      const name = (item.FriendlyName || '').toLowerCase();
      const id = (item.InstanceId || '').toLowerCase();

      if (name.includes('bootloader') || name.includes('fastboot') || id.includes('pid_d00d') || id.includes('pid_4ee0')) {
        hasFastboot = true;
        detectedMode = 'Fastboot';
      } else if (name.includes('preloader') || name.includes('vcom') || id.includes('vid_0e8d') || name.includes('mediatek')) {
        hasMtk = true;
        detectedMode = 'MediaTek BROM/Preloader';
      } else if (
        name.includes('adb') || 
        id.includes('pid_4ee7') || 
        id.includes('pid_2e81') || 
        id.includes('pid_ff08') || 
        id.includes('vid_2717') || 
        id.includes('vid_22d9') || 
        id.includes('vid_22b8') || 
        id.includes('vid_04e8')
      ) {
        hasAdb = true;
        detectedMode = 'ADB';
      }
    }

    const isConnected = hasAdb || hasFastboot || hasMtk;
    const rawModel = parsed.Model || null;
    const resolved = resolveDevice(rawModel, parsed.Brand);

    return {
      connected: isConnected,
      adb: hasAdb,
      fastboot: hasFastboot,
      mtk: hasMtk,
      mode: detectedMode,
      brand: resolved.brand || (isConnected ? 'Android' : null),
      model: resolved.model,
      rawModel: rawModel
    };
  } catch (err) {
    console.error('Device monitor error:', err.message);
    return { connected: false, adb: false, fastboot: false, mtk: false, brand: null, model: null, mode: null };
  } finally {
    isChecking = false;
  }
}
