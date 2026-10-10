import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

export async function checkAdbStatus() {
  try {
    // Check if adb is globally available in PATH
    await execPromise('adb version');
    
    // Find where it's actually installed
    const { stdout } = await execPromise('where adb');
    const adbPath = stdout.split('\r\n')[0].trim();
    
    return { 
      installed: true, 
      path: path.dirname(adbPath) 
    };
  } catch (error) {
    // If not in PATH, check our default isolated installation folder
    const customPath = path.join(os.homedir(), 'AppData', 'Local', 'DriverHub', 'platform-tools', 'adb.exe');
    
    if (fs.existsSync(customPath)) {
      return { 
        installed: true, 
        path: path.dirname(customPath) 
      };
    }
    
    return { 
      installed: false, 
      path: null 
    };
  }
}

export async function scanAllDrivers() {
  const adb = await checkAdbStatus();
  // We can add Google USB and MTK checks here later
  return { adb };
}
