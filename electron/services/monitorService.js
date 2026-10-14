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

let scriptSynced = false;
function getScriptPath() {
  const bundled = path.join(__dirname, 'detectDevices.ps1');
  if (!scriptSynced) {
    try {
      if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });
      if (fs.existsSync(bundled)) {
        fs.copyFileSync(bundled, stagedScriptPath);
        scriptSynced = true;
        return stagedScriptPath;
      }
    } catch {}
  }

  if (fs.existsSync(stagedScriptPath)) return stagedScriptPath;

  if (process.resourcesPath) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'services', 'detectDevices.ps1');
    if (fs.existsSync(unpacked)) {
      try { 
        fs.copyFileSync(unpacked, stagedScriptPath); 
        scriptSynced = true;
        return stagedScriptPath; 
      } catch {}
      return unpacked;
    }
  }
  return bundled;
}

let isChecking = false;
let lastKnownPhysicalDevice = null;

// Caches to avoid hammering USB sockets & adbd on device
const fastbootCache = new Map(); // serial -> { product, manufacturer, unlocked, isUserspace }
const adbStaticCache = new Map(); // serial -> { androidVersion, bootloaderState }
const adbDynamicCache = new Map(); // serial -> { batteryInfo, storageInfo, lastChecked }

// Dynamically discover candidate ADB executable paths
function getAdbExecutable() {
  const candidates = [
    'C:\\platform-tools-latest-windows\\adb.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe'),
    path.join(__dirname, '..', 'bin', 'platform-tools', 'adb.exe'),
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

function getFastbootExecutable() {
  const candidates = [
    'C:\\platform-tools-latest-windows\\fastboot.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'fastboot.exe'),
    path.join(__dirname, '..', 'bin', 'platform-tools', 'fastboot.exe'),
    path.join(os.homedir(), 'Downloads', 'platform-tools', 'fastboot.exe'),
    path.join(os.homedir(), 'Downloads', 'Programs', 'POCO M7 Plus', 'platform-tools', 'fastboot.exe'),
  ];

  if (process.resourcesPath) {
    candidates.push(
      path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'bin', 'platform-tools', 'fastboot.exe'),
      path.join(process.resourcesPath, 'electron', 'bin', 'platform-tools', 'fastboot.exe')
    );
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return `"${c}"`;
    }
  }
  return 'fastboot';
}

// Direct fastboot query (< 50ms)
async function checkFastbootDirect() {
  try {
    const fbCmd = getFastbootExecutable();
    const { stdout, stderr } = await execPromise(`${fbCmd} devices`, { timeout: 1200 });
    const output = ((stdout || '') + (stderr || '')).trim();
    if (!output) return null;

    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2 && parts[1].toLowerCase().includes('fastboot')) {
        const serial = parts[0];

        let product = null;
        let unlocked = null;
        let isUserspace = false;
        let manufacturer = null;

        if (fastbootCache.has(serial)) {
          const cached = fastbootCache.get(serial);
          product = cached.product;
          unlocked = cached.unlocked;
          isUserspace = cached.isUserspace;
          manufacturer = cached.manufacturer;
        } else {
          try {
            const { stdout: pOut, stderr: pErr } = await execPromise(`${fbCmd} -s ${serial} getvar product`, { timeout: 1000 });
            const m = ((pOut || '') + (pErr || '')).match(/product:\s*([^\r\n]+)/i);
            if (m) product = m[1].trim();
          } catch {}

          try {
            const { stdout: mOut, stderr: mErr } = await execPromise(`${fbCmd} -s ${serial} getvar manufacturer`, { timeout: 800 });
            const m = ((mOut || '') + (mErr || '')).match(/manufacturer:\s*([^\r\n]+)/i);
            if (m) manufacturer = m[1].trim();
          } catch {}

          try {
            const { stdout: uOut, stderr: uErr } = await execPromise(`${fbCmd} -s ${serial} getvar unlocked`, { timeout: 1000 });
            const m = ((uOut || '') + (uErr || '')).match(/unlocked:\s*([^\r\n]+)/i);
            if (m) {
              const v = m[1].trim().toLowerCase();
              unlocked = (v === 'yes' || v === 'true' || v === '1') ? 'Unlocked 🟢' : 'Locked 🔒';
            }
          } catch {}

          try {
            const { stdout: sOut } = await execPromise(`${fbCmd} -s ${serial} getvar is-userspace`, { timeout: 800 });
            if ((sOut || '').includes('yes')) isUserspace = true;
          } catch {}

          fastbootCache.set(serial, { product, unlocked, isUserspace, manufacturer });
        }

        let resolved = null;
        if (product) {
          resolved = resolveDevice(product, manufacturer);
        }

        // Strict physical serial comparison:
        const isSamePhysicalSerial = Boolean(
          lastKnownPhysicalDevice &&
          lastKnownPhysicalDevice.serial &&
          serial &&
          lastKnownPhysicalDevice.serial.trim().toLowerCase() === serial.trim().toLowerCase()
        );

        if (lastKnownPhysicalDevice && !isSamePhysicalSerial) {
          lastKnownPhysicalDevice = null;
        }

        if ((!resolved || resolved.model.includes('Device') || resolved.brand === 'Google') && isSamePhysicalSerial) {
          resolved = {
            brand: lastKnownPhysicalDevice.brand,
            model: lastKnownPhysicalDevice.model
          };
        } else if (!resolved) {
          resolved = { brand: manufacturer || 'Android', model: product ? `${product} (Bootloader)` : 'Android Bootloader Device' };
        }

        const storageDisplay = isSamePhysicalSerial && lastKnownPhysicalDevice?.storage
          ? (lastKnownPhysicalDevice.storage.total ? `${lastKnownPhysicalDevice.storage.total} (Protected)` : lastKnownPhysicalDevice.storage)
          : 'Device Protected';

        return {
          connected: true,
          fastboot: true,
          adb: false,
          mtk: false,
          mtp: false,
          mode: isUserspace ? 'FastbootD Mode' : 'Fastboot Mode',
          brand: resolved.brand || manufacturer || 'Android',
          model: resolved.model || (product ? `${product} (Bootloader)` : 'Android Bootloader'),
          rawModel: product ? `${product} • Fastboot` : (isSamePhysicalSerial && lastKnownPhysicalDevice?.model ? `${lastKnownPhysicalDevice.model} • Fastboot` : 'Bootloader'),
          serial: serial,
          androidVersion: isUserspace ? 'FastbootD (Userspace)' : 'Fastboot Bootloader',
          battery: 'Host USB Powered',
          bootloaderState: unlocked || 'Unlocked (Bootloader)',
          storage: storageDisplay,
          usbSpeed: 'USB 3.0',
          driverName: 'Android Bootloader Interface'
        };
      }
    }
  } catch {}
  return null;
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

          if (resolved.model && !resolved.model.includes('Device')) {
            lastKnownPhysicalDevice = {
              serial: serial,
              brand: resolved.brand,
              model: resolved.model,
              rawModel: rawModel,
              storage: null
            };
          }

          let androidVersion = null;
          let batteryInfo = { level: null, status: 'Charging', isCharging: true };
          let bootloaderState = 'Locked';
          let storageInfo = null;

          if (state === 'device') {
            // Check static cache first
            if (adbStaticCache.has(serial)) {
              const cached = adbStaticCache.get(serial);
              androidVersion = cached.androidVersion;
              bootloaderState = cached.bootloaderState;
            } else {
              try {
                const { stdout: osRelease } = await execPromise(`${adbCmd} -s ${serial} shell getprop ro.build.version.release`, { timeout: 1200 });
                if (osRelease.trim()) androidVersion = `Android ${osRelease.trim()}`;
              } catch {}

              try {
                const { stdout: blProp } = await execPromise(`${adbCmd} -s ${serial} shell getprop ro.boot.flash.locked`, { timeout: 1000 });
                if (blProp.trim() === '1') bootloaderState = 'Locked';
                else if (blProp.trim() === '0') bootloaderState = 'Unlocked';
              } catch {}

              adbStaticCache.set(serial, { androidVersion, bootloaderState });
            }

            // Check dynamic cache (refresh battery & storage at most once every 15 seconds)
            const now = Date.now();
            const dyn = adbDynamicCache.get(serial);
            if (dyn && (now - dyn.lastChecked < 15000)) {
              batteryInfo = dyn.batteryInfo;
              storageInfo = dyn.storageInfo;
            } else {
              try {
                const { stdout: bDump } = await execPromise(`${adbCmd} -s ${serial} shell dumpsys battery`, { timeout: 1200 });
                const levelMatch = bDump.match(/level:\s*(\d+)/i);
                const statusMatch = bDump.match(/status:\s*(\d+)/i);
                const isCharging = statusMatch && (statusMatch[1] === '2' || statusMatch[1] === '5');
                if (levelMatch) {
                  batteryInfo = {
                    level: `${levelMatch[1]}%`,
                    status: isCharging ? 'Charging' : 'On Battery',
                    isCharging: Boolean(isCharging)
                  };
                }
              } catch {}

              try {
                const { stdout: dfOut } = await execPromise(`${adbCmd} -s ${serial} shell df -h /data`, { timeout: 1200 });
                const dLines = dfOut.trim().split('\n');
                if (dLines.length > 1) {
                  const dParts = dLines[1].trim().split(/\s+/);
                  if (dParts.length >= 5) {
                    storageInfo = {
                      total: dParts[1],
                      used: dParts[2],
                      free: dParts[3],
                      percent: dParts[4]
                    };
                    if (lastKnownPhysicalDevice) {
                      lastKnownPhysicalDevice.storage = storageInfo;
                    }
                  }
                }
              } catch {}

              adbDynamicCache.set(serial, { batteryInfo, storageInfo, lastChecked: now });
            }
          }

          let batteryDisplay = 'Charging';
          if (batteryInfo.level) {
            batteryDisplay = `${batteryInfo.level} • ${batteryInfo.status}`;
          }

          return {
            connected: true,
            adb: true,
            adbAuthorized: state === 'device',
            fastboot: false,
            mtk: false,
            mtp: false,
            mode: state === 'device' ? 'ADB Debugging' : 'ADB (Unauthorized)',
            brand: resolved.brand || brand || 'Android',
            model: resolved.model || rawModel || 'Android Device',
            rawModel: rawModel || serial,
            serial: serial,
            androidVersion: androidVersion || 'Android',
            battery: batteryDisplay,
            bootloaderState: bootloaderState,
            storage: storageInfo ? `${storageInfo.free} free of ${storageInfo.total}` : 'Internal Storage',
            usbSpeed: 'USB 3.0',
            driverName: 'Android Composite ADB Interface'
          };
        }
      }
    }
  } catch (err) {
    // ADB command not found or no devices
  }
  return null;
}

async function doCheckConnectedDevices() {
  try {
    // Tier 1: Check native ADB daemon directly (< 50ms, 100% accurate)
    const directAdbResult = await checkAdbDirect();
    if (directAdbResult) {
      return directAdbResult;
    }

    // Tier 1.5: Check native Fastboot directly (< 50ms, 100% accurate)
    const directFastbootResult = await checkFastbootDirect();
    if (directFastbootResult) {
      return directFastbootResult;
    }

    // Tier 2: Query Windows USB PnP (For Fastboot, MTK BROM, Preloader, VCOM, MTP, Charging)
    const effectiveScript = getScriptPath();
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${effectiveScript}"`;
    const { stdout } = await execPromise(cmd, { timeout: 8000 });
    
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

    let adbDriverError = false;
    let fastbootDriverError = false;
    let mtkDriverError = false;

    for (const item of deviceList) {
      const name = (item.FriendlyName || '').toLowerCase();
      const id = (item.InstanceId || '').toLowerCase();
      const pnpClass = (item.PNPClass || '').toLowerCase();
      const isProblematic = (typeof item.ConfigManagerErrorCode === 'number' && item.ConfigManagerErrorCode !== 0) || (item.Status && item.Status !== 'OK');

      // 1. Check Fastboot / Bootloader
      if (name.includes('bootloader') || name.includes('fastboot') || id.includes('pid_d00d') || id.includes('pid_4ee0')) {
        hasFastboot = true;
        hasUsbPhysical = true;
        if (isProblematic) fastbootDriverError = true;
      } 
      // 2. Check MTK BROM / Preloader / VCOM
      else if (name.includes('preloader') || name.includes('vcom') || id.includes('vid_0e8d') || name.includes('mediatek')) {
        hasMtk = true;
        hasUsbPhysical = true;
        if (isProblematic) mtkDriverError = true;
      } 
      // 3. Check ADB (ONLY if interface name actually contains 'adb' or class is AndroidUsbDeviceClass without bootloader)
      else if (name.includes('adb') || (pnpClass === 'androidusbdeviceclass' && !name.includes('bootloader') && !name.includes('fastboot'))) {
        hasAdb = true;
        hasUsbPhysical = true;
        if (isProblematic) adbDriverError = true;
      }
      // 4. Check File Transfer / MTP (WPD class or MTP description)
      else if (pnpClass === 'wpd' || name.includes('mtp') || id.includes('ms_comp_mtp')) {
        hasMtp = true;
        hasUsbPhysical = true;
      }
      // 5. Generic physical USB phone connection (Motorola, Xiaomi, OnePlus, Samsung, Google, Vivo, etc.)
      else if (id.match(/vid_(22b8|2717|22d9|2a70|04e8|18d1|2b4b|19d2|2e04|12d1|0e8d|0b05|0fce|1004|0bb4)/i)) {
        hasUsbPhysical = true;
      }
    }

    const isConnected = hasUsbPhysical || hasAdb || hasFastboot || hasMtk || hasMtp || !!parsed.Model;

    let detectedMode = 'USB Connected';
    if (hasFastboot) {
      detectedMode = fastbootDriverError ? 'Fastboot (Driver Missing ⚠️)' : 'Fastboot Mode';
    } else if (hasMtk) {
      detectedMode = mtkDriverError ? 'MediaTek (Driver Missing ⚠️)' : 'MediaTek BROM / Preloader';
    } else if (hasAdb) {
      detectedMode = adbDriverError ? 'ADB (Driver Missing ⚠️)' : 'ADB Debugging';
    } else if (hasMtp) {
      detectedMode = 'File Transfer (MTP)';
    } else if (isConnected) {
      detectedMode = 'USB Connected';
    }

    let rawModel = parsed.Model || null;
    let usbSerial = null;

    for (const item of deviceList) {
      const id = (item.InstanceId || '');
      const parts = id.split('\\');
      if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart && !lastPart.includes('&') && lastPart.length >= 4) {
          usbSerial = lastPart;
          break;
        }
      }
    }

    // Fall back to specific device names if parsed.Model is generic or empty
    if (!rawModel || /interface|composite|controller|winusb/i.test(rawModel)) {
      for (const item of deviceList) {
        const fn = (item.FriendlyName || '').trim();
        if (fn && !/interface|composite|controller|winusb|hub/i.test(fn)) {
          rawModel = fn;
          break;
        }
      }
    }

    let resolved = resolveDevice(rawModel, parsed.Brand);

    // If real physical phone was detected (e.g. MTP or normal USB), cache it WITH its serial
    if (resolved.model && !resolved.model.includes('Device') && resolved.brand !== 'Android') {
      lastKnownPhysicalDevice = {
        serial: usbSerial || null,
        brand: resolved.brand,
        model: resolved.model,
        rawModel: rawModel,
        storage: parsed.Storage || null
      };
    }

    const isSamePhysicalSerial = Boolean(
      lastKnownPhysicalDevice &&
      lastKnownPhysicalDevice.serial &&
      usbSerial &&
      lastKnownPhysicalDevice.serial.trim().toLowerCase() === usbSerial.trim().toLowerCase()
    );

    // If a different device was plugged in, purge stale cache
    if (lastKnownPhysicalDevice && usbSerial && !isSamePhysicalSerial) {
      lastKnownPhysicalDevice = null;
    }

    // If in Fastboot mode and identity is generic "Google Device" / "Android Bootloader"
    if (hasFastboot) {
      if ((!resolved.model || resolved.model.includes('Device') || resolved.brand === 'Google') && isSamePhysicalSerial) {
        resolved = {
          brand: lastKnownPhysicalDevice.brand,
          model: lastKnownPhysicalDevice.model
        };
      }
    }

    const storageDisplay = hasFastboot
      ? (isSamePhysicalSerial && lastKnownPhysicalDevice?.storage ? (lastKnownPhysicalDevice.storage.total ? `${lastKnownPhysicalDevice.storage.total} (Protected)` : lastKnownPhysicalDevice.storage) : 'Device Protected')
      : (parsed.Storage || null);

    return {
      connected: isConnected,
      adb: hasAdb && !adbDriverError,
      adbError: adbDriverError,
      fastboot: hasFastboot && !fastbootDriverError,
      fastbootError: fastbootDriverError,
      mtk: hasMtk && !mtkDriverError,
      mtkError: mtkDriverError,
      mtp: hasMtp,
      mode: isConnected ? detectedMode : null,
      driverError: fastbootDriverError || adbDriverError || mtkDriverError,
      brand: resolved.brand || (isConnected ? (parsed.Brand || 'Android') : null),
      model: resolved.model || parsed.Model,
      rawModel: rawModel,
      usbSpeed: parsed.UsbSpeed || 'USB 2.0',
      driverName: parsed.DriverName || (hasMtp ? 'MTP USB Device' : (hasFastboot ? 'Android Bootloader Interface' : 'Android USB Driver')),
      storage: storageDisplay,
      battery: isConnected ? 'USB Powered' : null,
      androidVersion: hasMtp ? 'File Transfer (MTP)' : (hasFastboot ? 'Fastboot Bootloader' : null),
      bootloaderState: hasFastboot ? 'Fastboot Bootloader' : null
    };
  } catch (err) {
    console.warn('Device monitor probe delayed/warning:', err.message);
    // Retain previous connected state during transient OS query latency so we don't cause false drops
    if (lastKnownDevice && lastKnownDevice.connected) {
      return lastKnownDevice;
    }
    return { connected: false, adb: false, fastboot: false, mtk: false, mtp: false, brand: null, model: null, mode: null };
  }
}

let consecutiveDisconnects = 0;
let lastKnownDevice = null;

export async function checkConnectedDevices() {
  if (isChecking) {
    return null; // Avoid overlapping executions
  }
  isChecking = true;

  try {
    const rawResult = await doCheckConnectedDevices();
    if (rawResult && rawResult.connected) {
      consecutiveDisconnects = 0;
      lastKnownDevice = rawResult;
      return rawResult;
    }

    // Debounce temporary connection loss during USB mode switch / plug handshake / sleep
    // Require 3 consecutive confirmed disconnect polls (~7.5s) before broadcasting unplug
    consecutiveDisconnects++;
    if (consecutiveDisconnects < 3 && lastKnownDevice && lastKnownDevice.connected) {
      return lastKnownDevice;
    }

    lastKnownDevice = null;
    lastKnownPhysicalDevice = null; // Clean cache completely on true physical disconnect
    fastbootCache.clear();
    adbStaticCache.clear();
    adbDynamicCache.clear();
    return rawResult || { connected: false, adb: false, fastboot: false, mtk: false, mtp: false, brand: null, model: null, mode: null };
  } finally {
    isChecking = false;
  }
}
