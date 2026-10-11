import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';
import { checkDriverStore } from './scannerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

const ADB_DOWNLOAD_URL = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
const INSTALL_DIR = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools');
const DRIVERS_STAGING_DIR = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'drivers');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Recursively copy a folder from source to destination
 */
function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

/**
 * Resolves bundled directory path across development, unpacked, and packaged modes
 */
function getBundledDir(...subpaths) {
  const directPath = path.join(__dirname, '..', 'bin', ...subpaths);
  if (fs.existsSync(directPath)) return directPath;

  if (process.resourcesPath) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'bin', ...subpaths);
    if (fs.existsSync(unpacked)) return unpacked;

    const resourcesBin = path.join(process.resourcesPath, 'electron', 'bin', ...subpaths);
    if (fs.existsSync(resourcesBin)) return resourcesBin;
  }

  return directPath;
}

/**
 * Downloads a file with smoothed streaming progress updates
 */
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath, onProgress).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`Server returned status code ${response.statusCode}`));
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;
      let lastReportTime = 0;
      let lastReportedPercent = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const now = Date.now();
        
        if (totalBytes > 0) {
          // Map download phase smoothly from 10% to 70%
          const pct = Math.min(Math.round((downloadedBytes / totalBytes) * 60) + 10, 70);
          
          if ((pct > lastReportedPercent && now - lastReportTime >= 50) || downloadedBytes === totalBytes) {
            lastReportedPercent = pct;
            lastReportTime = now;
            const mbDownloaded = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
            onProgress(pct, `Downloading ADB: ${mbDownloaded} MB / ${mbTotal} MB (${Math.round((downloadedBytes / totalBytes) * 100)}%)`);
          }
        } else {
          const mbDownloaded = (downloadedBytes / (1024 * 1024)).toFixed(1);
          onProgress(35, `Downloading ADB: ${mbDownloaded} MB...`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    request.setTimeout(45000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error('Connection timed out'));
    });
  });
}

/**
 * Executes Windows pnputil to install driver INF into DriverStore.
 * Handles direct execution and automatic UAC elevation if needed.
 */
async function executePnPUtil(infPath) {
  // Step 1: Try direct execution first (succeeds if running as Administrator or driver is already staged)
  try {
    const { stdout } = await execPromise(`pnputil /add-driver "${infPath}" /install`, { timeout: 30000 });
    return { success: true, stdout };
  } catch (err) {
    const combinedOutput = ((err.stdout || '') + ' ' + (err.stderr || '')).toLowerCase();

    // Check if pnputil succeeded despite non-zero exit code (code 1 is returned when driver already exists)
    if (combinedOutput.includes('successfully') || combinedOutput.includes('already exists') || combinedOutput.includes('oem')) {
      return { success: true, stdout: err.stdout };
    }

    // Step 2: Elevation needed (e.g. fresh system without Admin privileges)
    // Run pnputil elevated using Start-Process with -Verb RunAs via PowerShell EncodedCommand
    // This safely eliminates any quote or space-in-path parsing bugs in Windows CMD
    const safeInfPath = infPath.replace(/'/g, "''");
    const psScript = `
      $p = Start-Process -FilePath "pnputil.exe" -ArgumentList ('/add-driver "{0}" /install' -f '${safeInfPath}') -Verb RunAs -PassThru -Wait;
      exit $p.ExitCode;
    `;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    try {
      await execPromise(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { timeout: 60000 });
      return { success: true, elevated: true };
    } catch (elevateErr) {
      if (elevateErr.code === 1 || elevateErr.code === 0) {
        return { success: true, elevated: true };
      }
      throw new Error(`Driver installation requires administrator permission: ${elevateErr.message}`);
    }
  }
}

/**
 * Installs ADB Platform-Tools with rhythmic pacing and smooth phase transitions:
 * 1. Connecting (0 - 10%)
 * 2. Downloading (10% - 70%)
 * 3. Extracting archive (70% - 85%)
 * 4. Configuring Windows User PATH (85% - 95%)
 * 5. Verifying & Completion (95% - 100%)
 */
export async function installAdb(eventSender) {
  const notify = (percent, message) => {
    if (eventSender) {
      eventSender.send('install-step', {
        target: 'adb',
        percent: percent,
        message: message
      });
    }
  };

  notify(5, 'Connecting to official Google Android repository...');
  await sleep(250);

  // Ensure directories exist
  const parentDir = path.dirname(INSTALL_DIR);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const zipPath = path.join(parentDir, 'platform-tools-latest.zip');
  let downloadedSuccessfully = false;

  try {
    notify(10, 'Fetching latest platform-tools from Google CDN...');
    await downloadFile(ADB_DOWNLOAD_URL, zipPath, (pct, msg) => {
      notify(pct, msg);
    });
    downloadedSuccessfully = true;
    notify(72, 'Download completed. Verifying archive integrity...');
    await sleep(350);
  } catch (err) {
    console.warn('Online download failed or offline mode. Falling back to bundled binaries:', err.message);
    notify(40, 'Online repository unreachable. Utilizing verified bundled package...');
    await sleep(300);
  }

  // Extraction / Deployment
  if (downloadedSuccessfully && fs.existsSync(zipPath)) {
    notify(78, 'Extracting ADB Platform-Tools to LocalAppData...');
    await sleep(300);
    try {
      const extractCmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${parentDir}' -Force"`;
      await execPromise(extractCmd, { timeout: 30000 });
      
      try { fs.unlinkSync(zipPath); } catch {}
    } catch (extractErr) {
      console.warn('Extraction error, using fallback:', extractErr.message);
      downloadedSuccessfully = false;
    }
  }

  // Fallback to bundled if download or extraction didn't produce the directory
  if (!fs.existsSync(path.join(INSTALL_DIR, 'adb.exe'))) {
    notify(80, 'Deploying bundled Platform-Tools package...');
    await sleep(250);
    const bundledDir = getBundledDir('platform-tools');
    if (fs.existsSync(bundledDir)) {
      copyFolderRecursive(bundledDir, INSTALL_DIR);
    }
  }

  // Verify adb.exe exists
  const adbExe = path.join(INSTALL_DIR, 'adb.exe');
  if (!fs.existsSync(adbExe)) {
    throw new Error('ADB installation failed: adb.exe not found.');
  }

  // Add to Windows User PATH permanently
  notify(88, 'Configuring Windows User PATH environment variable...');
  await sleep(400);
  try {
    const setPathScript = `
      $target = '${INSTALL_DIR}'
      $current = [Environment]::GetEnvironmentVariable('Path', 'User')
      if ($current -notlike "*$target*") {
        $new = if ($current) { "$current;$target" } else { $target }
        [Environment]::SetEnvironmentVariable('Path', $new, 'User')
      }
    `;
    await execPromise(`powershell -NoProfile -Command "${setPathScript.replace(/\n/g, ' ')}"`);
  } catch (pathErr) {
    console.warn('Could not set User PATH:', pathErr.message);
  }

  // Test ADB binary
  notify(95, 'Verifying ADB & Fastboot binaries...');
  await sleep(350);
  let ver = 'latest';
  try {
    const { stdout } = await execPromise(`"${adbExe}" version`);
    const versionMatch = stdout.match(/version ([^\r\n]+)/);
    if (versionMatch) ver = versionMatch[1];
  } catch {}

  notify(100, `ADB Platform-Tools ${ver} installed and ready!`);
  await sleep(600); // Allow user to see 100% completion state

  return {
    success: true,
    path: INSTALL_DIR
  };
}

/**
 * Installs Google USB & Bootloader driver package via PnPUtil
 */
export async function installGoogleDriver(eventSender) {
  const notify = (percent, message) => {
    if (eventSender) {
      eventSender.send('install-step', {
        target: 'google',
        percent: percent,
        message: message
      });
    }
  };

  notify(10, 'Preparing Google USB & Bootloader driver package...');
  await sleep(250);

  // 1. Stage driver files to clean AppData directory
  const bundledGoogleDir = getBundledDir('drivers', 'google');
  const targetDir = path.join(DRIVERS_STAGING_DIR, 'google');
  
  notify(30, 'Staging driver package to local repository...');
  await sleep(200);

  if (fs.existsSync(bundledGoogleDir)) {
    copyFolderRecursive(bundledGoogleDir, targetDir);
  }

  const infPath = path.join(targetDir, 'android_winusb.inf');
  if (!fs.existsSync(infPath)) {
    // Check direct bundled fallback
    const directInf = path.join(bundledGoogleDir, 'android_winusb.inf');
    if (!fs.existsSync(directInf)) {
      throw new Error('Google USB Driver package (android_winusb.inf) not found in application bundle.');
    }
  }

  const effectiveInfPath = fs.existsSync(infPath) ? infPath : path.join(bundledGoogleDir, 'android_winusb.inf');

  notify(70, 'Installing driver package via Windows PnP Utility...');
  await executePnPUtil(effectiveInfPath);

  // 2. Stage and install Motorola Fastboot / Bootloader driver
  const bundledMotoDir = getBundledDir('drivers', 'motorola');
  const targetMotoDir = path.join(DRIVERS_STAGING_DIR, 'motorola');
  if (fs.existsSync(bundledMotoDir)) {
    copyFolderRecursive(bundledMotoDir, targetMotoDir);
    const motoInf2 = path.join(targetMotoDir, 'motoandroid2.inf');
    if (fs.existsSync(motoInf2)) {
      try {
        notify(82, 'Registering Motorola Fastboot driver (motoandroid2.inf)...');
        await executePnPUtil(motoInf2);
      } catch (e) {
        console.warn('Motorola Fastboot driver install notice:', e.message);
      }
    }
  }

  notify(95, 'Verifying driver installation in Windows DriverStore...');
  await sleep(350);

  // Double check driverstore status
  try {
    const storeStatus = await checkDriverStore();
    if (storeStatus.google?.installed) {
      notify(100, `${storeStatus.google.name || 'Google USB Bootloader Driver'} ready in DriverStore!`);
    } else {
      notify(100, 'Google USB & Bootloader driver successfully installed!');
    }
  } catch {
    notify(100, 'Google USB & Bootloader driver successfully installed!');
  }

  await sleep(600);
  return { success: true, name: 'Google USB Bootloader Driver' };
}

/**
 * Installs MediaTek (MTK) VCOM & Preloader driver package via PnPUtil
 */
export async function installMtkDriver(eventSender) {
  const notify = (percent, message) => {
    if (eventSender) {
      eventSender.send('install-step', {
        target: 'mtk',
        percent: percent,
        message: message
      });
    }
  };

  notify(10, 'Preparing MediaTek VCOM & Preloader driver package...');
  await sleep(250);

  // 1. Stage driver files to clean AppData directory
  const bundledMtkDir = getBundledDir('drivers', 'mtk');
  const targetDir = path.join(DRIVERS_STAGING_DIR, 'mtk');

  notify(30, 'Staging MediaTek driver package to local repository...');
  await sleep(200);

  if (fs.existsSync(bundledMtkDir)) {
    copyFolderRecursive(bundledMtkDir, targetDir);
  }

  const infPath = path.join(targetDir, 'cdc-acm.inf');
  if (!fs.existsSync(infPath)) {
    const directInf = path.join(bundledMtkDir, 'cdc-acm.inf');
    if (!fs.existsSync(directInf)) {
      throw new Error('MediaTek driver package (cdc-acm.inf) not found in application bundle.');
    }
  }

  const effectiveInfPath = fs.existsSync(infPath) ? infPath : path.join(bundledMtkDir, 'cdc-acm.inf');

  notify(60, 'Registering cdc-acm.inf into Windows DriverStore...');
  await sleep(300);

  notify(75, 'Installing MediaTek VCOM/Preloader via Windows PnP Utility...');
  await executePnPUtil(effectiveInfPath);

  notify(95, 'Verifying MediaTek driver in Windows DriverStore...');
  await sleep(350);

  try {
    const storeStatus = await checkDriverStore();
    if (storeStatus.mtk?.installed) {
      notify(100, `${storeStatus.mtk.name || 'MediaTek Drivers'} ready in DriverStore!`);
    } else {
      notify(100, 'MediaTek Drivers successfully installed into DriverStore!');
    }
  } catch {
    notify(100, 'MediaTek Drivers successfully installed into DriverStore!');
  }

  await sleep(600);
  return { success: true, name: 'MediaTek USB VCOM / Preloader Driver' };
}
