import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

const scriptPath = path.join(__dirname, 'detectDevices.ps1');

// Popular OEM model number translation map
const MODEL_NAME_MAP = {
  // OnePlus
  'HD1901': 'OnePlus 7T',
  'HD1900': 'OnePlus 7T',
  'HD1903': 'OnePlus 7T',
  'HD1907': 'OnePlus 7T',
  'GM1911': 'OnePlus 7 Pro',
  'GM1901': 'OnePlus 7',
  'KB2001': 'OnePlus 8T',
  'IN2021': 'OnePlus 8 Pro',
  'IN2011': 'OnePlus 8',
  'NE2211': 'OnePlus 10 Pro',
  'CPH2447': 'OnePlus 11',
  'CPH2581': 'OnePlus 12',
  'CPH2611': 'OnePlus 12R',
  'CPH2413': 'OnePlus Nord 2T',
  'CPH2513': 'OnePlus Nord 3',
  'CPH2381': 'OnePlus Nord CE 2 Lite',

  // Xiaomi / POCO / Redmi
  'M2012K11AG': 'POCO F3',
  '22081212UG': 'POCO F4 GT',
  '23049PCD8G': 'POCO F5',
  '24053PY09G': 'POCO F6',
  '21091116UG': 'Redmi Note 11 Pro',
  '22101316G': 'Redmi Note 12 Pro',
  '2312DRA50G': 'Redmi Note 13 Pro',

  // Samsung
  'SM-S928B': 'Galaxy S24 Ultra',
  'SM-S918B': 'Galaxy S23 Ultra',
  'SM-S908B': 'Galaxy S22 Ultra',
  'SM-A546B': 'Galaxy A54 5G',
  'SM-A556B': 'Galaxy A55 5G'
};

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
    const friendlyModel = MODEL_NAME_MAP[rawModel] || rawModel;

    return {
      connected: isConnected,
      adb: hasAdb,
      fastboot: hasFastboot,
      mtk: hasMtk,
      mode: detectedMode,
      brand: parsed.Brand || (isConnected ? 'Android' : null),
      model: friendlyModel,
      rawModel: rawModel
    };
  } catch (err) {
    return { connected: false, adb: false, fastboot: false, mtk: false, brand: null, model: null, mode: null };
  }
}
