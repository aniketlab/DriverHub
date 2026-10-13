import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

const execPromise = util.promisify(exec);

/**
 * Parses MM/DD/YYYY driver date into Unix epoch timestamp
 */
function parseDriverDate(dateStr) {
  if (!dateStr) return 0;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day).getTime();
  }
  return 0;
}

/**
 * Parses version string (e.g. "11.0.0.0", "37.0.1") into numeric array
 */
function parseSemVer(verStr) {
  if (!verStr) return [0];
  return verStr.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
}

/**
 * Compares two semantic version strings:
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const p1 = parseSemVer(v1);
  const p2 = parseSemVer(v2);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

/**
 * Sorts drivers list by date descending, then version descending,
 * returning the latest active driver in Windows DriverStore.
 */
function pickLatestDriver(drivers) {
  if (!drivers || drivers.length === 0) return null;
  return drivers.sort((a, b) => {
    const dDiff = parseDriverDate(b.date) - parseDriverDate(a.date);
    if (dDiff !== 0) return dDiff;
    return compareVersions(b.ver, a.ver);
  })[0];
}

/**
 * Checks ADB Platform-Tools status, true release version, and update status.
 */
export async function checkAdbStatus() {
  console.log('--- Scanner: Checking ADB Status ---');
  let adbExe = null;
  let adbDir = null;
  let version = null;

  // 1. Check custom install directory in LocalAppData first
  const customPath = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe');
  const customPropPath = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'source.properties');

  if (fs.existsSync(customPath)) {
    adbExe = customPath;
    adbDir = path.dirname(customPath);
    if (fs.existsSync(customPropPath)) {
      try {
        const propContent = fs.readFileSync(customPropPath, 'utf8');
        const revMatch = propContent.match(/Pkg\.Revision\s*=\s*([0-9.]+)/i);
        if (revMatch) version = revMatch[1];
      } catch {}
    }
  }

  // 2. If not found in LocalAppData, check system PATH
  if (!adbExe) {
    try {
      const { stdout } = await execPromise('where adb', { timeout: 2000 });
      const firstLine = stdout.split('\r\n')[0].trim();
      if (firstLine && fs.existsSync(firstLine)) {
        adbExe = firstLine;
        adbDir = path.dirname(firstLine);
        const sysPropPath = path.join(adbDir, 'source.properties');
        if (fs.existsSync(sysPropPath)) {
          try {
            const propContent = fs.readFileSync(sysPropPath, 'utf8');
            const revMatch = propContent.match(/Pkg\.Revision\s*=\s*([0-9.]+)/i);
            if (revMatch) version = revMatch[1];
          } catch {}
        }
      }
    } catch {}
  }

  // 3. Fallback: query binary version directly via adb version
  if (adbExe && !version) {
    try {
      const { stdout: verOut } = await execPromise(`"${adbExe}" version`, { timeout: 2500 });
      // Example output:
      // Android Debug Bridge version 1.0.41
      // Version 37.0.1-15733141
      const matchRelease = verOut.match(/Version\s+([0-9.]+)-?/i);
      const matchProto = verOut.match(/version\s+([0-9.]+)/i);
      if (matchRelease) version = matchRelease[1];
      else if (matchProto) version = matchProto[1];
    } catch {}
  }

  if (!adbExe || !fs.existsSync(adbExe)) {
    return { installed: false, path: null, version: null, updateAvailable: false };
  }

  // Default baseline if version couldn't be parsed
  const installedVer = version || '35.0.2';
  
  // Latest Google Android Platform-Tools release target is 37.0.1
  const TARGET_LATEST_ADB = '37.0.1';
  const updateAvailable = compareVersions(installedVer, TARGET_LATEST_ADB) < 0;

  console.log(`Scanner: ADB found at -> ${adbDir}, version: ${installedVer}, updateAvailable: ${updateAvailable}`);
  return {
    installed: true,
    path: adbDir,
    version: installedVer,
    updateAvailable
  };
}

/**
 * Queries Windows DriverStore (PnPUtil) and accurately detects the latest
 * installed drivers, versions, and legitimate update availability.
 */
export async function checkDriverStore() {
  console.log('--- Scanner: Checking Windows DriverStore (PnPUtil) ---');
  try {
    const { stdout } = await execPromise('pnputil /enum-drivers', { timeout: 10000 });
    const blocks = stdout.split(/Published Name:\s*/i).slice(1);

    const googleUsbList = [];
    const bootloaderList = [];
    const mtkVcomList = [];
    const mtkBromList = [];

    for (const block of blocks) {
      const lower = block.toLowerCase();

      // Extract driver version & date
      const vMatch = block.match(/Driver Version:\s*([0-9/]+)?\s*([0-9.]+)?/i);
      const driverDate = vMatch ? vMatch[1] : null;
      const driverVer = vMatch ? vMatch[2] : null;
      const pubMatch = block.match(/^([^\r\n]+)/);
      const pubName = pubMatch ? pubMatch[1].trim() : '';

      const driverEntry = {
        pub: pubName,
        ver: driverVer,
        date: driverDate
      };

      // 1. Android ADB USB Driver (Google, OEM WinUSB)
      const isUsbAdb = lower.includes('androidusbdeviceclass') || 
                       lower.includes('android_winusb.inf') || 
                       lower.includes('sprdadb.inf') ||
                       (lower.includes('class name:         usb') && lower.includes('adb'));

      if (isUsbAdb && driverVer) {
        googleUsbList.push(driverEntry);
      }

      // 2. Android Bootloader / Fastboot interface
      const isBootloader = lower.includes('android bootloader interface') || 
                           lower.includes('motoandroid2.inf') ||
                           lower.includes('motoandroid.inf') ||
                           (lower.includes('android_winusb.inf') && (lower.includes('fastboot') || lower.includes('bootloader')));

      if (isBootloader && driverVer) {
        bootloaderList.push(driverEntry);
      }

      // 3. MediaTek VCOM / Preloader
      const isVcomPreloader = lower.includes('oppo_preloader.inf') || 
                              lower.includes('preloader') || 
                              (lower.includes('cdc-acm.inf') && lower.includes('mediatek') && lower.includes('preloader'));

      if (isVcomPreloader && driverVer) {
        mtkVcomList.push(driverEntry);
      }

      // 4. MediaTek BROM Driver (CDC-ACM ports / USB2SER)
      const isBrom = lower.includes('cdc-acm.inf') || 
                     lower.includes('usb2ser.inf') || 
                     (lower.includes('ports') && lower.includes('mediatek'));

      if (isBrom && driverVer) {
        mtkBromList.push(driverEntry);
      }
    }

    // Pick the newest/highest installed driver in each category
    const bestGoogleUsb = pickLatestDriver(googleUsbList);
    const bestBootloader = pickLatestDriver(bootloaderList);
    const bestMtkVcom = pickLatestDriver(mtkVcomList);
    const bestMtkBrom = pickLatestDriver(mtkBromList);

    // Target reference baselines from application bundle:
    // Google USB: android_winusb.inf -> Date: 01/04/2023, Version: 11.0.0.0
    // Google Bootloader: motoandroid2.inf / android_winusb.inf -> 2.0.2.0 / 11.0.0.0
    // MTK VCOM: oppo_preloader.inf -> Date: 02/22/2024, Version: 1.4.0.0
    // MTK BROM: cdc-acm.inf -> Date: 01/04/2023, Version: 3.0.1512.0

    const TARGET_GOOGLE_USB_DATE = '01/04/2023';
    const TARGET_GOOGLE_USB_VER = '11.0.0.0';

    // Google USB is considered outdated ONLY IF the latest installed driver is strictly older than 2023 / 11.0.0.0
    const googleUsbUpdateAvailable = Boolean(
      bestGoogleUsb && 
      (parseDriverDate(bestGoogleUsb.date) < parseDriverDate(TARGET_GOOGLE_USB_DATE) && compareVersions(bestGoogleUsb.ver, TARGET_GOOGLE_USB_VER) < 0)
    );

    const TARGET_MTK_BROM_DATE = '01/04/2023';
    const TARGET_MTK_BROM_VER = '3.0.1512.0';
    const mtkBromUpdateAvailable = Boolean(
      bestMtkBrom && 
      (parseDriverDate(bestMtkBrom.date) < parseDriverDate(TARGET_MTK_BROM_DATE) && compareVersions(bestMtkBrom.ver, TARGET_MTK_BROM_VER) < 0)
    );

    console.log(`Scanner: DriverStore results ->
      Google USB: ${Boolean(bestGoogleUsb)} (ver: ${bestGoogleUsb?.ver}, updateAvailable: ${googleUsbUpdateAvailable}),
      Bootloader: ${Boolean(bestBootloader)} (ver: ${bestBootloader?.ver}),
      MTK Preloader: ${Boolean(bestMtkVcom)} (ver: ${bestMtkVcom?.ver}),
      MTK BROM: ${Boolean(bestMtkBrom)} (ver: ${bestMtkBrom?.ver}, updateAvailable: ${mtkBromUpdateAvailable})`);

    const packages = {
      google_usb: {
        installed: Boolean(bestGoogleUsb),
        version: bestGoogleUsb?.ver || TARGET_GOOGLE_USB_VER,
        updateAvailable: googleUsbUpdateAvailable,
        name: 'Google USB Driver'
      },
      google_bootloader: {
        installed: Boolean(bestBootloader),
        version: bestBootloader?.ver || '2.0.2.0',
        updateAvailable: false,
        name: 'Google Bootloader Interface'
      },
      mtk_vcom: {
        installed: Boolean(bestMtkVcom),
        version: bestMtkVcom?.ver || '1.4.0.0',
        updateAvailable: false,
        name: 'MTK VCOM Preloader'
      },
      mtk_brom: {
        installed: Boolean(bestMtkBrom),
        version: bestMtkBrom?.ver || TARGET_MTK_BROM_VER,
        updateAvailable: mtkBromUpdateAvailable,
        name: 'MTK BROM Driver'
      }
    };

    return {
      google: { 
        installed: Boolean(bestGoogleUsb || bestBootloader), 
        name: 'Google USB Driver' 
      },
      mtk: { 
        installed: Boolean(bestMtkVcom || bestMtkBrom), 
        name: 'MediaTek USB VCOM / Preloader Driver' 
      },
      packages
    };
  } catch (err) {
    console.error('Scanner: Error querying DriverStore:', err);
    return {
      google: { installed: false },
      mtk: { installed: false },
      packages: {
        google_usb: { installed: false, updateAvailable: false },
        google_bootloader: { installed: false, updateAvailable: false },
        mtk_vcom: { installed: false, updateAvailable: false },
        mtk_brom: { installed: false, updateAvailable: false }
      }
    };
  }
}
