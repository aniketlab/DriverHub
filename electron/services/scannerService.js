import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

export async function checkAdbStatus() {
  console.log('--- Scanner: Checking ADB Status ---');
  try {
    const { stdout: verOut } = await execPromise('adb version', { timeout: 2500 });
    const { stdout } = await execPromise('where adb', { timeout: 2000 });
    const adbPath = stdout.split('\r\n')[0].trim();
    let version = '35.0.2';
    const match = verOut.match(/version\s+([0-9.]+)/i);
    if (match) version = match[1];

    console.log('Scanner: ADB found at ->', adbPath, 'version:', version);
    return { installed: true, path: path.dirname(adbPath), version, updateAvailable: false };
  } catch (error) {
    const customPath = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe');
    if (fs.existsSync(customPath)) {
      let version = '35.0.2';
      try {
        const { stdout: verOut } = await execPromise(`"${customPath}" version`, { timeout: 2500 });
        const match = verOut.match(/version\s+([0-9.]+)/i);
        if (match) version = match[1];
      } catch {}
      return { installed: true, path: path.dirname(customPath), version, updateAvailable: false };
    }
    return { installed: false, path: null, version: null, updateAvailable: false };
  }
}

export async function checkDriverStore() {
  console.log('--- Scanner: Checking Windows DriverStore (PnPUtil) ---');
  try {
    const { stdout } = await execPromise('pnputil /enum-drivers', { timeout: 10000 });
    const blocks = stdout.split(/Published Name:\s*/i).slice(1);
    
    let hasGoogleUsb = false;
    let googleUsbVersion = null;
    let googleUsbDate = null;
    let googleUsbOld = false;

    let hasGoogleBootloader = false;
    let googleBootloaderVersion = null;

    let hasMtkVcom = false;
    let mtkVcomVersion = null;

    let hasMtkBrom = false;
    let mtkBromVersion = null;

    let mtkDriverName = null;
    let googleDriverName = null;

    for (const block of blocks) {
      const lower = block.toLowerCase();

      // Extract driver version & date if present
      const vMatch = block.match(/Driver Version:\s*([0-9/]+)?\s*([0-9.]+)?/i);
      const driverDate = vMatch ? vMatch[1] : null;
      const driverVer = vMatch ? vMatch[2] : null;

      // 1. Check for Android ADB USB Driver (Google, OEM ADB WinUSB)
      const isUsbAdb = lower.includes('androidusbdeviceclass') || 
                       lower.includes('android_winusb.inf') || 
                       lower.includes('sprdadb.inf') ||
                       (lower.includes('class name:         usb') && lower.includes('adb'));

      if (isUsbAdb) {
        hasGoogleUsb = true;
        googleUsbVersion = driverVer || googleUsbVersion;
        googleUsbDate = driverDate || googleUsbDate;
        
        // If driver date is older than 2021 or version < 11, mark update available
        if (driverDate) {
          const year = parseInt(driverDate.slice(-4));
          if (!isNaN(year) && year < 2021) {
            googleUsbOld = true;
          }
        }
        if (lower.includes('google')) googleDriverName = 'Google USB Driver';
      }

      // 2. Check for Android Bootloader / Fastboot interface
      const isBootloader = lower.includes('android bootloader interface') || 
                           lower.includes('motoandroid2.inf') ||
                           (lower.includes('android_winusb.inf') && (lower.includes('fastboot') || lower.includes('bootloader')));

      if (isBootloader) {
        hasGoogleBootloader = true;
        googleBootloaderVersion = driverVer || googleBootloaderVersion;
      }

      // 3. Check for MediaTek VCOM / Preloader
      const isVcomPreloader = lower.includes('oppo_preloader.inf') || 
                              lower.includes('preloader') || 
                              (lower.includes('cdc-acm.inf') && lower.includes('mediatek'));

      if (isVcomPreloader) {
        hasMtkVcom = true;
        mtkVcomVersion = driverVer || mtkVcomVersion;
        mtkDriverName = 'MediaTek USB VCOM / Preloader Driver';
      }

      // 4. Check for MediaTek BROM Driver (MediaTek USB Port 0003, usb2ser, cdc-acm port)
      const isBrom = lower.includes('usb2ser.inf') || 
                     lower.includes('brom') || 
                     (lower.includes('cdc-acm.inf') && lower.includes('ports'));

      if (isBrom) {
        hasMtkBrom = true;
        mtkBromVersion = driverVer || mtkBromVersion;
      }
    }

    console.log(`Scanner: DriverStore results ->
      Google USB: ${hasGoogleUsb} (old: ${googleUsbOld}),
      Bootloader: ${hasGoogleBootloader},
      MTK Preloader: ${hasMtkVcom},
      MTK BROM: ${hasMtkBrom}`);

    const packages = {
      google_usb: {
        installed: hasGoogleUsb,
        version: googleUsbVersion || '13.0.0.0',
        updateAvailable: googleUsbOld,
        name: 'Google USB Driver'
      },
      google_bootloader: {
        installed: hasGoogleBootloader,
        version: googleBootloaderVersion || '11.0.0.0',
        updateAvailable: false,
        name: 'Google Bootloader Interface'
      },
      mtk_vcom: {
        installed: hasMtkVcom,
        version: mtkVcomVersion || '1.1129.0.0',
        updateAvailable: false,
        name: 'MTK VCOM Preloader'
      },
      mtk_brom: {
        installed: hasMtkBrom,
        version: mtkBromVersion || '1.1129.0.0',
        updateAvailable: false,
        name: 'MTK BROM Driver'
      }
    };

    return {
      google: { installed: hasGoogleUsb || hasGoogleBootloader, name: googleDriverName || 'Google USB Bootloader Driver' },
      mtk: { installed: hasMtkVcom || hasMtkBrom, name: mtkDriverName || 'MediaTek USB VCOM / Preloader Driver' },
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
