import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);

export function getAdbExecutable() {
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe'),
    path.join(__dirname, '..', 'bin', 'platform-tools', 'adb.exe'),
    'C:\\platform-tools-latest-windows\\adb.exe',
    path.join(os.homedir(), 'Downloads', 'platform-tools', 'adb.exe'),
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

export function getFastbootExecutable() {
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'fastboot.exe'),
    path.join(__dirname, '..', 'bin', 'platform-tools', 'fastboot.exe'),
    'C:\\platform-tools-latest-windows\\fastboot.exe',
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

/**
 * Reboot device to bootloader, recovery, or system
 */
export async function rebootDevice(mode = 'bootloader') {
  const adbCmd = getAdbExecutable();
  const fastbootCmd = getFastbootExecutable();

  let targetArg = '';
  if (mode === 'bootloader') targetArg = 'bootloader';
  else if (mode === 'recovery') targetArg = 'recovery';

  console.log(`Backend deviceAction: Rebooting to -> ${mode}`);

  // Try ADB first
  try {
    const cmd = `${adbCmd} reboot ${targetArg}`.trim();
    const { stdout, stderr } = await execPromise(cmd, { timeout: 8000 });
    console.log(`ADB reboot output: ${stdout || stderr || 'Success'}`);
    return {
      success: true,
      mode,
      message: `Rebooting device to ${mode}...`
    };
  } catch (adbErr) {
    console.warn(`ADB reboot failed: ${adbErr.message}. Trying Fastboot...`);
  }

  // Fallback to Fastboot if already in fastboot mode
  try {
    let fbArg = 'reboot';
    if (mode === 'bootloader') fbArg = 'reboot-bootloader';
    else if (mode === 'recovery') fbArg = 'reboot-recovery';

    const cmd = `${fastbootCmd} ${fbArg}`;
    const { stdout, stderr } = await execPromise(cmd, { timeout: 8000 });
    return {
      success: true,
      mode,
      message: `Fastboot: Rebooting to ${mode}...`
    };
  } catch (fbErr) {
    throw new Error(`Device reboot command failed. Ensure ADB or Fastboot is authorized. (${fbErr.message})`);
  }
}

/**
 * Opens native interactive Command Prompt running ADB shell
 */
export async function openAdbShell() {
  const adbCmd = getAdbExecutable();
  console.log('Backend deviceAction: Spawning ADB Shell terminal...');

  return new Promise((resolve, reject) => {
    // Windows: start cmd.exe /k opens a dedicated interactive terminal window
    const spawnCmd = `start "DriverHub - Android ADB Shell" cmd.exe /k "title Android ADB Shell && echo Connected to Android Shell. Type 'exit' to quit. && ${adbCmd} shell"`;
    exec(spawnCmd, (err) => {
      if (err) {
        console.error('Failed to open ADB shell:', err);
        reject(err);
      } else {
        resolve({ success: true, message: 'ADB Shell opened in terminal window.' });
      }
    });
  });
}

/**
 * Opens phone's storage in Windows File Explorer
 */
export async function openPhoneStorage(customPath = null) {
  console.log('Backend deviceAction: Opening phone in Explorer...');

  const scriptDir = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'scripts');
  const stagedPath = path.join(scriptDir, 'openPhoneStorage.ps1');
  const bundledPath = path.join(__dirname, 'openPhoneStorage.ps1');

  let scriptToRun = bundledPath;
  try {
    if (!fs.existsSync(scriptDir)) fs.mkdirSync(scriptDir, { recursive: true });
    if (fs.existsSync(bundledPath)) {
      fs.copyFileSync(bundledPath, stagedPath);
      scriptToRun = stagedPath;
    } else if (fs.existsSync(stagedPath)) {
      scriptToRun = stagedPath;
    }
  } catch (e) {
    console.warn('Could not stage openPhoneStorage.ps1:', e);
  }

  return new Promise((resolve) => {
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptToRun}"`, (err) => {
      if (err) {
        console.warn('PowerShell storage open failed, opening This PC:', err);
        exec('explorer.exe shell:MyComputerFolder');
      }
      resolve({ success: true, message: 'Opened phone storage in Windows File Explorer.' });
    });
  });
}

