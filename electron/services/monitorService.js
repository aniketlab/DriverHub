import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

const scriptPath = path.join(__dirname, 'detectDevices.ps1');

export async function checkConnectedDevices() {
  try {
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    const { stdout } = await execPromise(cmd, { timeout: 3000 });
    
    const trimmed = stdout.trim();
    if (!trimmed) {
      return { adb: false, fastboot: false, mtk: false, name: null };
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { adb: false, fastboot: false, mtk: false, name: null };
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];

    let hasAdb = false;
    let hasFastboot = false;
    let hasMtk = false;
    let detectedName = null;

    for (const item of items) {
      const name = (item.FriendlyName || '').toLowerCase();
      const id = (item.InstanceId || '').toLowerCase();

      if (name.includes('bootloader') || name.includes('fastboot') || id.includes('pid_d00d') || id.includes('pid_4ee0')) {
        hasFastboot = true;
        detectedName = item.FriendlyName || 'Android Bootloader Device';
      } else if (name.includes('adb') || id.includes('pid_4ee7')) {
        hasAdb = true;
        detectedName = item.FriendlyName || 'Android ADB Device';
      } else if (name.includes('preloader') || name.includes('vcom') || id.includes('vid_0e8d') || name.includes('mediatek')) {
        hasMtk = true;
        detectedName = item.FriendlyName || 'MediaTek Preloader / BROM Device';
      }
    }

    return {
      adb: hasAdb,
      fastboot: hasFastboot,
      mtk: hasMtk,
      name: detectedName
    };
  } catch (err) {
    // Fails silently if powershell is busy
    return { adb: false, fastboot: false, mtk: false, name: null };
  }
}
