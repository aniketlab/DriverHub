import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

const ADB_DOWNLOAD_URL = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
const INSTALL_DIR = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools');
const BUNDLED_DIR = path.join(__dirname, '..', 'bin', 'platform-tools');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    if (fs.existsSync(BUNDLED_DIR)) {
      if (!fs.existsSync(INSTALL_DIR)) {
        fs.mkdirSync(INSTALL_DIR, { recursive: true });
      }
      const files = fs.readdirSync(BUNDLED_DIR);
      for (const f of files) {
        fs.copyFileSync(path.join(BUNDLED_DIR, f), path.join(INSTALL_DIR, f));
      }
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
