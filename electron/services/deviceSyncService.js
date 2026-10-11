import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDatabase } from '../data/deviceDatabase.js';

const CDN_DEVICES_URL = 'https://cdn.jsdelivr.net/gh/bsthen/device-models/devices.json';

/**
 * Background auto-sync service for newly released smartphones.
 * Runs non-blockingly, checks CDN for fresh device updates and caches them locally.
 */
export async function syncDeviceDatabase() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(CDN_DEVICES_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return;

    const data = await res.json();
    if (!data || typeof data !== 'object') return;

    const db = getDatabase();
    if (!db || !db.models) return;

    let addedCount = 0;
    for (const [key, item] of Object.entries(data)) {
      if (!item || !item.name) continue;
      const lowerKey = key.toLowerCase().trim();
      if (!db.models[lowerKey]) {
        db.models[lowerKey] = {
          b: item.brand || 'Android',
          m: item.name
        };
        addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`[DeviceSync] Synced ${addedCount} newly released devices from CDN.`);
      if (app && app.getPath) {
        const cachePath = path.join(app.getPath('userData'), 'devices_cache.json');
        fs.writeFile(cachePath, JSON.stringify(data), 'utf8', () => {});
      }
    }
  } catch (err) {
    // Offline or network timeout - fail silently, offline database continues seamlessly
  }
}
