import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import electronPkg from 'electron';
const app = electronPkg?.app || electronPkg?.default?.app;
const shell = electronPkg?.shell || electronPkg?.default?.shell;



const GITHUB_OWNER = 'aniketlab';
const GITHUB_REPO = 'DriverHub';
const APP_DATA_DIR = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub');
const UPDATES_DIR = path.join(APP_DATA_DIR, 'updates');

try {
  if (!fs.existsSync(UPDATES_DIR)) {
    fs.mkdirSync(UPDATES_DIR, { recursive: true });
  }
} catch {}

function parseSemver(v) {
  if (!v) return [0, 0, 0];
  const clean = v.replace(/^v/i, '').trim();
  const parts = clean.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function isNewerVersion(latest, current) {
  const [lMaj, lMin, lPat] = parseSemver(latest);
  const [cMaj, cMin, cPat] = parseSemver(current);
  if (lMaj > cMaj) return true;
  if (lMaj < cMaj) return false;
  if (lMin > cMin) return true;
  if (lMin < cMin) return false;
  return lPat > cPat;
}

export function getCurrentVersion() {
  try {
    return app.isPackaged ? app.getVersion() : '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Check GitHub Releases for newer version
 */
export async function checkForAppUpdates() {
  const currentVersion = getCurrentVersion();
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DriverHub-Desktop-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      // No releases exist yet on repository
      return {
        success: true,
        updateAvailable: false,
        status: 'no_releases',
        currentVersion,
        latestVersion: currentVersion,
        message: 'No releases published yet on GitHub. You are on the latest build (v' + currentVersion + ').',
        repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
      };
    }

    if (!res.ok) {
      throw new Error(`GitHub API responded with status ${res.status}`);
    }

    const data = await res.json();
    const tagName = data.tag_name || '';
    const hasNewer = isNewerVersion(tagName, currentVersion);

    // Look for Windows installer asset (.exe)
    const assets = Array.isArray(data.assets) ? data.assets : [];
    const exeAsset = assets.find(a => a.name && a.name.toLowerCase().endsWith('.exe'));

    if (hasNewer) {
      return {
        success: true,
        updateAvailable: true,
        status: 'update_available',
        currentVersion,
        latestVersion: tagName,
        releaseName: data.name || tagName,
        releaseNotes: data.body || '',
        publishedAt: data.published_at,
        htmlUrl: data.html_url,
        downloadUrl: exeAsset ? exeAsset.browser_download_url : data.html_url,
        assetName: exeAsset ? exeAsset.name : `DriverHub-Setup-${tagName}.exe`,
        assetSize: exeAsset ? exeAsset.size : 0,
        hasInstaller: Boolean(exeAsset),
        repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
      };
    } else {
      return {
        success: true,
        updateAvailable: false,
        status: 'up_to_date',
        currentVersion,
        latestVersion: tagName || currentVersion,
        releaseName: data.name || tagName || 'Current Version',
        releaseNotes: data.body || '',
        publishedAt: data.published_at,
        htmlUrl: data.html_url,
        message: `Driver Hub is up to date (v${currentVersion}).`,
        repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
      };
    }
  } catch (err) {
    console.warn('Update check failed:', err.message);
    return {
      success: false,
      updateAvailable: false,
      status: 'error',
      currentVersion,
      message: `Could not check GitHub releases: ${err.message}`,
      repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
    };
  }
}

/**
 * Download OTA update file with live progress streaming
 */
export async function downloadUpdateFile(downloadUrl, assetName, sender) {
  if (!downloadUrl) {
    throw new Error('No download URL provided for update.');
  }

  const fileName = assetName || `DriverHub-Update-${Date.now()}.exe`;
  const targetPath = path.join(UPDATES_DIR, fileName);

  try {
    const res = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'DriverHub-Desktop-App'
      }
    });

    if (!res.ok) {
      throw new Error(`Download failed with HTTP ${res.status}: ${res.statusText}`);
    }

    const total = parseInt(res.headers.get('content-length') || '0', 10);
    let transferred = 0;
    const fileStream = fs.createWriteStream(targetPath);

    const reader = res.body.getReader();
    let lastEmit = Date.now();
    let startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      transferred += value.length;
      fileStream.write(Buffer.from(value));

      const now = Date.now();
      if (now - lastEmit > 120) {
        lastEmit = now;
        const elapsedSec = (now - startTime) / 1000;
        const speed = elapsedSec > 0 ? transferred / elapsedSec : 0;
        const percent = total > 0 ? Math.min(99, Math.round((transferred / total) * 100)) : 0;

        if (sender && !sender.isDestroyed()) {
          sender.send('update:download-progress', {
            percent,
            transferred,
            total,
            speed,
            assetName: fileName
          });
        }
      }
    }

    fileStream.end();
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    if (sender && !sender.isDestroyed()) {
      sender.send('update:download-progress', {
        percent: 100,
        transferred: total || transferred,
        total: total || transferred,
        speed: 0,
        assetName: fileName
      });
      sender.send('update:downloaded', {
        filePath: targetPath,
        assetName: fileName
      });
    }

    return { success: true, filePath: targetPath };
  } catch (err) {
    console.error('Update download error:', err);
    try {
      if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    } catch {}
    throw err;
  }
}

/**
 * Execute downloaded installer and restart Driver Hub
 */
export async function installDownloadedUpdate(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Downloaded installer file does not exist on disk.');
  }

  try {
    // Launch installer with elevated privileges
    const psCmd = `Start-Process -FilePath '${filePath.replace(/'/g, "''")}' -Verb RunAs`;
    const encoded = Buffer.from(psCmd, 'utf16le').toString('base64');

    exec(`powershell.exe -NoProfile -WindowStyle Hidden -EncodedCommand ${encoded}`, (err) => {
      if (err) {
        console.warn('Installer failed or was cancelled by user:', err.message);
      }
    });

    // Close current instance after a brief moment to allow installer to run cleanly
    setTimeout(() => {
      app.exit(0);
    }, 1200);

    return { success: true };
  } catch (err) {
    console.error('Failed to launch installer:', err);
    return { success: false, error: err.message };
  }
}
