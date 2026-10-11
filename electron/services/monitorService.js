import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveDevice } from '../data/deviceDatabase.js';

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
      } else if (name.includes('adb') || id.includes('pid_4ee7')) {
        hasAdb = true;
        detectedMode = 'ADB';
      } else if (name.includes('preloader') || name.includes('vcom') || id.includes('vid_0e8d') || name.includes('mediatek')) {
        hasMtk = true;
        detectedMode = 'MediaTek BROM/Preloader';
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
    return { connected: false, adb: false, fastboot: false, mtk: false, brand: null, model: null, mode: null };
  }
}
