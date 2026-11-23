import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isLoaded = false;
let rawDb = null;
const modelIndex = new Map();       // normalized model number -> item
const nameIndex = new Map();        // normalized device marketing name -> item
const brandIndex = new Map();       // brand slug -> brand array

function normalizeKey(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[\s\-_]/g, '').trim();
}

/**
 * Classify chip vendor from chip marketing name or code
 */
export function classifyChipVendor(chipName, chipCode) {
  const text = `${chipName || ''} ${chipCode || ''}`.toLowerCase();
  if (!text.trim()) return 'generic';

  if (text.includes('dimensity') || text.includes('helio') || text.includes('mt6') || text.includes('mt8') || text.includes('mediatek') || text.includes('mtk')) {
    return 'mediatek';
  }
  if (text.includes('snapdragon') || text.includes('qualcomm') || text.includes('qcom') || /\bsm\d/i.test(text) || /\bmsm\d/i.test(text) || /\bsdm\d/i.test(text)) {
    return 'qualcomm';
  }
  if (text.includes('unisoc') || text.includes('spreadtrum') || text.includes('sprd') || text.includes('spd') || /\bsc\d/i.test(text) || /\bt6\d\d/i.test(text)) {
    return 'unisoc';
  }
  if (text.includes('exynos')) {
    return 'samsung';
  }
  if (text.includes('tensor')) {
    return 'google';
  }
  if (text.includes('kirin') || text.includes('hisilicon')) {
    return 'huawei';
  }
  if (text.includes('allwinner')) {
    return 'allwinner';
  }
  if (text.includes('rockchip')) {
    return 'rockchip';
  }
  return 'generic';
}

/**
 * Determine recommended drivers based on chipset vendor
 */
export function getRecommendedDrivers(chipVendor) {
  switch (chipVendor) {
    case 'mediatek':
      return [
        { id: 'mtk_brom', name: 'MediaTek (MTK) BROM & VCOM Drivers', priority: 'critical', mode: 'BootROM / PreLoader' },
        { id: 'google_usb', name: 'Google USB & ADB Drivers', priority: 'standard', mode: 'ADB / Fastboot' }
      ];
    case 'qualcomm':
      return [
        { id: 'google_usb', name: 'Google USB & Fastboot Drivers', priority: 'critical', mode: 'ADB / Fastboot' },
        { id: 'qualcomm_9008', name: 'Qualcomm HS-USB QDLoader 9008', priority: 'recommended', mode: 'Emergency EDL' }
      ];
    case 'unisoc':
      return [
        { id: 'unisoc_spd', name: 'Unisoc / Spreadtrum (SPD) USB Drivers', priority: 'critical', mode: 'SPRD Diag / Flash' },
        { id: 'google_usb', name: 'Google USB & ADB Drivers', priority: 'standard', mode: 'ADB / Fastboot' }
      ];
    case 'samsung':
      return [
        { id: 'samsung_usb', name: 'Samsung Mobile USB Drivers', priority: 'critical', mode: 'Odin / Download Mode' },
        { id: 'google_usb', name: 'Google USB & ADB Drivers', priority: 'standard', mode: 'ADB' }
      ];
    default:
      return [
        { id: 'google_usb', name: 'Google USB & Bootloader Drivers', priority: 'critical', mode: 'Universal ADB / WinUSB' }
      ];
  }
}

/**
 * Lazy initialize the in-memory lookup index
 */
export function initDeviceIntelligence() {
  if (isLoaded) return;
  try {
    const dbPath = path.resolve(__dirname, '../data/mfdl_device_db.json');
    if (!fs.existsSync(dbPath)) {
      console.warn('mfdl_device_db.json not found at:', dbPath);
      return;
    }

    const raw = fs.readFileSync(dbPath, 'utf8');
    rawDb = JSON.parse(raw);

    for (const [brandSlug, brandData] of Object.entries(rawDb)) {
      const brandName = brandData.n || brandSlug;
      const items = brandData.i || [];
      brandIndex.set(brandSlug, { name: brandName, items });

      for (const item of items) {
        // item = [ DeviceName, ChipName, ChipCode, ReleaseYear, ModelNumber ]
        const [devName, chipName, chipCode, year, modelNo] = item;
        const vendor = classifyChipVendor(chipName, chipCode);
        const record = {
          brand: brandName,
          marketingName: devName,
          chipset: chipName || 'Unknown SoC',
          chipCode: chipCode || '',
          chipVendor: vendor,
          releaseYear: year || '',
          modelNumber: modelNo || '',
          recommendedDrivers: getRecommendedDrivers(vendor)
        };

        // Index by model number if available
        if (modelNo) {
          const normModel = normalizeKey(modelNo);
          if (normModel && !modelIndex.has(normModel)) {
            modelIndex.set(normModel, record);
          }
        }

        // Index by device name
        if (devName) {
          const normName = normalizeKey(devName);
          if (normName && !nameIndex.has(normName)) {
            nameIndex.set(normName, record);
          }
          // Also index with brand prefix stripped if applicable
          const withoutBrand = devName.replace(new RegExp(`^${brandName}\\s*`, 'i'), '').trim();
          const normWithoutBrand = normalizeKey(withoutBrand);
          if (normWithoutBrand && !nameIndex.has(normWithoutBrand)) {
            nameIndex.set(normWithoutBrand, record);
          }
        }
      }
    }

    isLoaded = true;
    console.log(`[DeviceIntelligence] Initialized with ${modelIndex.size} indexed models and ${nameIndex.size} device names.`);
  } catch (err) {
    console.error('[DeviceIntelligence] Initialization error:', err);
  }
}

/**
 * Enrich a device object with chipset, marketing name, and recommended drivers
 */
export function enrichDevice(device) {
  if (!device) return device;
  if (!isLoaded) initDeviceIntelligence();

  const rawModel = device.rawModel || device.model || '';
  const brand = device.brand || '';
  const normModel = normalizeKey(rawModel);
  const normName = normalizeKey(device.model || '');

  // 1. Check Model Number match (e.g., SM-A276E, XT2509-1, 26067PC09G, HD1901)
  let found = modelIndex.get(normModel);

  // 2. Check Device Name match (e.g., OnePlus 7T, Poco M8s, Galaxy A27)
  if (!found) {
    found = nameIndex.get(normName) || nameIndex.get(normModel);
  }

  // 3. Fallback prefix or partial search for Samsung (SM-xxxx) or Motorola (XTxxxx)
  if (!found && normModel.length >= 5) {
    for (const [k, v] of modelIndex.entries()) {
      if (k.startsWith(normModel) || normModel.startsWith(k)) {
        found = v;
        break;
      }
    }
  }

  if (found) {
    return {
      ...device,
      brand: found.brand || device.brand,
      model: found.marketingName || device.model,
      chipset: found.chipset,
      chipCode: found.chipCode,
      chipVendor: found.chipVendor,
      releaseYear: found.releaseYear,
      modelNumber: found.modelNumber || rawModel,
      recommendedDrivers: found.recommendedDrivers
    };
  }

  // Fallback chipset classification if brand/model has clues
  const vendor = classifyChipVendor(rawModel, device.model);
  return {
    ...device,
    chipset: device.chipset || null,
    chipCode: device.chipCode || null,
    chipVendor: vendor !== 'generic' ? vendor : (device.chipVendor || null),
    releaseYear: device.releaseYear || null,
    recommendedDrivers: getRecommendedDrivers(vendor)
  };
}

/**
 * Search the 17,000+ device catalog by keyword
 */
export function searchDevices(query, limit = 30) {
  if (!isLoaded) initDeviceIntelligence();
  if (!query || !query.trim()) return [];

  const q = normalizeKey(query);
  const results = [];

  for (const [k, v] of nameIndex.entries()) {
    if (k.includes(q)) {
      results.push(v);
      if (results.length >= limit) return results;
    }
  }

  for (const [k, v] of modelIndex.entries()) {
    if (k.includes(q) && !results.some(r => r.marketingName === v.marketingName)) {
      results.push(v);
      if (results.length >= limit) return results;
    }
  }

  return results;
}
