import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = util.promisify(exec);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CONFIG_PATH = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'config.json');
const DEFAULT_TOOLS_PATH = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {}
  return {};
}

function saveConfig(cfg) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save config:', err.message);
  }
}

export function getPlatformToolsDir() {
  const cfg = loadConfig();
  if (cfg.platformToolsPath && fs.existsSync(cfg.platformToolsPath)) {
    return cfg.platformToolsPath;
  }

  if (fs.existsSync(DEFAULT_TOOLS_PATH)) {
    return DEFAULT_TOOLS_PATH;
  }

  const bundled = path.join(__dirname, '..', 'bin', 'platform-tools');
  if (fs.existsSync(bundled)) {
    return bundled;
  }

  return DEFAULT_TOOLS_PATH;
}

export async function isDirectoryInUserPath(targetDir) {
  try {
    const psCmd = `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path', 'User')"`;
    const { stdout } = await execPromise(psCmd, { timeout: 4000 });
    const paths = (stdout || '')
      .split(';')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    return paths.includes(targetDir.toLowerCase());
  } catch {
    return false;
  }
}

export function isAdbServerRunning(port = 5037) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

export async function getPlatformToolsDetails() {
  const toolsDir = getPlatformToolsDir();
  const adbExe = path.join(toolsDir, 'adb.exe');
  const isInstalled = fs.existsSync(adbExe);

  let version = '37.0.1';
  const propFile = path.join(toolsDir, 'source.properties');
  if (fs.existsSync(propFile)) {
    try {
      const content = fs.readFileSync(propFile, 'utf8');
      const m = content.match(/Pkg\.Revision\s*=\s*([0-9.]+)/i);
      if (m) version = m[1];
    } catch {}
  } else if (isInstalled) {
    try {
      const { stdout } = await execPromise(`"${adbExe}" version`, { timeout: 3000 });
      const m = stdout.match(/Version\s+([0-9.]+)-?/i) || stdout.match(/version\s+([0-9.]+)/i);
      if (m) version = m[1];
    } catch {}
  }

  const tools = [
    {
      name: 'adb.exe',
      desc: 'Talk to your phone over USB',
      exists: fs.existsSync(path.join(toolsDir, 'adb.exe'))
    },
    {
      name: 'fastboot.exe',
      desc: 'Flash and unlock in bootloader mode',
      exists: fs.existsSync(path.join(toolsDir, 'fastboot.exe'))
    },
    {
      name: 'mke2fs.exe',
      desc: 'Create ext4 filesystem images',
      exists: fs.existsSync(path.join(toolsDir, 'mke2fs.exe'))
    },
    {
      name: 'sqlite3.exe',
      desc: 'Read databases pulled from the device',
      exists: fs.existsSync(path.join(toolsDir, 'sqlite3.exe'))
    }
  ];

  const inPath = await isDirectoryInUserPath(toolsDir);
  const serverRunning = await isAdbServerRunning(5037);
  const cfg = loadConfig();
  const autoUpdate = Boolean(cfg.autoUpdateOnLaunch);

  return {
    installed: isInstalled,
    path: toolsDir,
    version,
    upToDate: true,
    inPath,
    autoUpdate,
    serverRunning,
    serverPort: 5037,
    tools
  };
}

export async function toggleSystemPath(enable) {
  const toolsDir = getPlatformToolsDir();
  try {
    let psScript = '';
    if (enable) {
      psScript = `
        $target = '${toolsDir}'
        $current = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($current -notlike "*$target*") {
          $new = if ($current) { "$current;$target" } else { $target }
          [Environment]::SetEnvironmentVariable('Path', $new, 'User')
        }
      `;
    } else {
      psScript = `
        $target = '${toolsDir}'
        $current = [Environment]::GetEnvironmentVariable('Path', 'User')
        $parts = $current -split ';' | Where-Object { $_ -and ($_.Trim().ToLower() -ne $target.ToLower()) }
        $new = $parts -join ';'
        [Environment]::SetEnvironmentVariable('Path', $new, 'User')
      `;
    }
    await execPromise(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { timeout: 6000 });
    const inPath = await isDirectoryInUserPath(toolsDir);
    return { success: true, inPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function toggleAutoUpdate(enable) {
  const cfg = loadConfig();
  cfg.autoUpdateOnLaunch = Boolean(enable);
  saveConfig(cfg);
  return { success: true, autoUpdate: cfg.autoUpdateOnLaunch };
}

export function setPlatformToolsDir(newDir) {
  if (fs.existsSync(newDir)) {
    const cfg = loadConfig();
    cfg.platformToolsPath = newDir;
    saveConfig(cfg);
    return { success: true, path: newDir };
  }
  return { success: false, error: 'Directory does not exist' };
}

export async function handleAdbServerAction(action) {
  const toolsDir = getPlatformToolsDir();
  const adbExe = path.join(toolsDir, 'adb.exe');
  const exe = fs.existsSync(adbExe) ? `"${adbExe}"` : 'adb';

  try {
    if (action === 'stop') {
      await execPromise(`${exe} kill-server`, { timeout: 6000 });
    } else if (action === 'start') {
      await execPromise(`${exe} start-server`, { timeout: 8000 });
    } else if (action === 'restart') {
      try { await execPromise(`${exe} kill-server`, { timeout: 6000 }); } catch {}
      await sleep(400);
      await execPromise(`${exe} start-server`, { timeout: 8000 });
    }
    await sleep(400);
    const isRunning = await isAdbServerRunning(5037);
    return { success: true, running: isRunning };
  } catch (err) {
    const isRunning = await isAdbServerRunning(5037);
    return { success: false, error: err.message, running: isRunning };
  }
}

export async function executeTerminalCommand(cmdString) {
  if (!cmdString || typeof cmdString !== 'string') {
    return { success: false, output: 'No command specified.' };
  }

  const trimmed = cmdString.trim();
  const toolsDir = getPlatformToolsDir();
  const adbExe = path.join(toolsDir, 'adb.exe');
  const fastbootExe = path.join(toolsDir, 'fastboot.exe');
  const sqlite3Exe = path.join(toolsDir, 'sqlite3.exe');
  const mke2fsExe = path.join(toolsDir, 'mke2fs.exe');

  let commandToRun = trimmed;
  if (/^adb\b/i.test(trimmed) && fs.existsSync(adbExe)) {
    commandToRun = `"${adbExe}"` + trimmed.slice(3);
  } else if (/^fastboot\b/i.test(trimmed) && fs.existsSync(fastbootExe)) {
    commandToRun = `"${fastbootExe}"` + trimmed.slice(8);
  } else if (/^sqlite3\b/i.test(trimmed) && fs.existsSync(sqlite3Exe)) {
    commandToRun = `"${sqlite3Exe}"` + trimmed.slice(7);
  } else if (/^mke2fs\b/i.test(trimmed) && fs.existsSync(mke2fsExe)) {
    commandToRun = `"${mke2fsExe}"` + trimmed.slice(6);
  }

  try {
    const { stdout, stderr } = await execPromise(commandToRun, {
      cwd: toolsDir,
      timeout: 20000,
      env: {
        ...process.env,
        PATH: `${toolsDir};${process.env.PATH || ''}`
      }
    });

    const out = (stdout || '') + (stderr ? (stdout ? '\n' : '') + stderr : '');
    return {
      success: true,
      output: out.trim() || 'Command executed successfully (no output returned).'
    };
  } catch (err) {
    const errOut = (err.stdout || '') + (err.stderr ? '\n' + err.stderr : (err.message ? '\n' + err.message : ''));
    return {
      success: false,
      output: errOut.trim() || `Error executing command: ${err.message}`
    };
  }
}
