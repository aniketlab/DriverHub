import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

export async function checkAdbStatus() {
  console.log('--- Scanner: Checking ADB Status ---');
  try {
    await execPromise('adb version', { timeout: 2000 });
    const { stdout } = await execPromise('where adb', { timeout: 2000 });
    const adbPath = stdout.split('\r\n')[0].trim();
    console.log('Scanner: ADB found at ->', adbPath);
    return { installed: true, path: path.dirname(adbPath) };
  } catch (error) {
    const customPath = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe');
    if (fs.existsSync(customPath)) {
      return { installed: true, path: path.dirname(customPath) };
    }
    return { installed: false, path: null };
  }
}

export async function checkDriverStore() {
  console.log('--- Scanner: Checking Windows DriverStore (PnPUtil) ---');
  try {
    const { stdout } = await execPromise('pnputil /enum-drivers', { timeout: 8000 });
    const blocks = stdout.split(/Published Name:\s*/i).slice(1);
    
    let hasGoogleUsb = false;
    let hasMtk = false;
    let mtkDriverName = null;
    let googleDriverName = null;

    for (const block of blocks) {
      const lower = block.toLowerCase();

      // Check for any valid Android Bootloader / Fastboot / WinUSB driver (Google, Xiaomi, OPLUS, etc.)
      const isWinUsb = lower.includes('android_winusb.inf') || 
                       lower.includes('class name:         androidusbdeviceclass') ||
                       lower.includes('android bootloader interface');

      const isMtk = lower.includes('provider name:     mediatek') || 
                    lower.includes('cdc-acm.inf') || 
                    lower.includes('usb2ser.inf') ||
                    lower.includes('oppo_preloader.inf');

      if (isWinUsb) {
        hasGoogleUsb = true;
        // Identify the OEM vendor (e.g., Xiaomi, Google, OPLUS)
        if (lower.includes('xiaomi')) googleDriverName = 'Xiaomi / Android Bootloader Driver';
        else if (lower.includes('google')) googleDriverName = 'Google USB Bootloader Driver';
        else if (lower.includes('oplus')) googleDriverName = 'OPLUS / Android Bootloader Driver';
        else googleDriverName = 'Universal Android Bootloader Driver';
      }

      if (isMtk) {
        hasMtk = true;
        mtkDriverName = 'MediaTek USB VCOM / Preloader Driver';
      }
    }

    console.log('Scanner: DriverStore results -> Bootloader:', hasGoogleUsb, '(', googleDriverName, ') | MTK:', hasMtk);
    return {
      google: { installed: hasGoogleUsb, name: googleDriverName },
      mtk: { installed: hasMtk, name: mtkDriverName }
    };
  } catch (err) {
    console.error('Scanner: Error querying DriverStore:', err);
    return {
      google: { installed: false },
      mtk: { installed: false }
    };
  }
}
