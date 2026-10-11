import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CSV_URL = 'https://storage.googleapis.com/play_public/supported_devices.csv';
const OUTPUT_FILE = path.resolve(__dirname, '../electron/data/devices_db.json');

// Standard Brand Capitalization Map
const BRAND_MAP = {
  'motorola': 'Motorola',
  'samsung': 'Samsung',
  'google': 'Google',
  'xiaomi': 'Xiaomi',
  'redmi': 'Xiaomi',
  'poco': 'POCO',
  'oneplus': 'OnePlus',
  'oppo': 'OPPO',
  'vivo': 'vivo',
  'realme': 'realme',
  'asus': 'ASUS',
  'nothing': 'Nothing',
  'sony': 'Sony',
  'zte': 'ZTE',
  'huawei': 'HUAWEI',
  'honor': 'HONOR',
  'infinix': 'Infinix',
  'tecno': 'TECNO',
  'itel': 'itel',
  'lenovo': 'Lenovo',
  'nokia': 'Nokia',
  'hmd': 'HMD',
  'meizu': 'Meizu',
  'sharp': 'Sharp',
  'lg': 'LG',
  'htc': 'HTC',
  'blackshark': 'Black Shark',
  'nubia': 'Nubia',
  'iqoo': 'iQOO'
};

function formatBrand(raw) {
  if (!raw) return 'Android';
  const clean = raw.trim();
  const lower = clean.toLowerCase();
  return BRAND_MAP[lower] || (clean.charAt(0).toUpperCase() + clean.slice(1));
}

function formatModelName(brand, marketingName, model) {
  let name = (marketingName || model || '').trim();
  if (!name) return 'Android Device';

  // Capitalize "moto " to "Moto "
  if (name.toLowerCase().startsWith('moto ')) {
    name = 'Moto ' + name.slice(5);
  }

  // Remove redundant leading brand prefix if present
  const bLower = brand.toLowerCase();
  if (name.toLowerCase().startsWith(bLower + ' ')) {
    name = name.slice(bLower.length + 1).trim();
  }

  return name;
}

// Minimal robust CSV line parser handling quotes
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function buildDatabase() {
  console.log('Fetching Google Play Supported Devices CSV...');
  const res = await fetch(GOOGLE_CSV_URL);
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

  const buffer = await res.arrayBuffer();
  console.log('Decoding UTF-16LE buffer...');
  const text = new TextDecoder('utf-16le').decode(buffer);

  const lines = text.split(/\r?\n/);
  console.log(`Processing ${lines.length} device records...`);

  const codenames = {};
  const models = {};

  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    if (cols.length < 4) continue;

    const rawBrand = cols[0];
    const marketingName = cols[1];
    const codename = cols[2];
    const modelNum = cols[3];

    if (!codename && !modelNum) continue;

    const brand = formatBrand(rawBrand);
    const model = formatModelName(brand, marketingName, modelNum);

    // Save under codename (Fastboot primary lookup)
    if (codename) {
      const cKey = codename.toLowerCase().trim();
      if (!codenames[cKey]) {
        codenames[cKey] = { b: brand, m: model };
      }
    }

    // Save under model number (MTP / ADB primary lookup)
    if (modelNum) {
      const mKey = modelNum.toLowerCase().trim();
      if (!models[mKey]) {
        models[mKey] = { b: brand, m: model };
      }
      // Also index stripped alphanumeric (without hyphens or spaces)
      const cleanKey = mKey.replace(/[\s\-_]/g, '');
      if (cleanKey && !models[cleanKey]) {
        models[cleanKey] = { b: brand, m: model };
      }
    }

    count++;
  }

  // Add popular community fastboot codenames and variants
  const manualOverrides = {
    // Motorola variants
    'fogos': { b: 'Motorola', m: 'Moto G34 5G' },
    'xt2363': { b: 'Motorola', m: 'Moto G34 5G' },
    'xt2363-1': { b: 'Motorola', m: 'Moto G34 5G' },
    'xt2363-2': { b: 'Motorola', m: 'Moto G34 5G' },
    'xt2363-3': { b: 'Motorola', m: 'Moto G34 5G' },
    'xt2363-4': { b: 'Motorola', m: 'Moto G34 5G' },
    'xt2363-5': { b: 'Motorola', m: 'Moto G34 5G' },
    'fogos s': { b: 'Motorola', m: 'Moto G34 5G' },
    // Google Pixels
    'husky': { b: 'Google', m: 'Pixel 8 Pro' },
    'shiba': { b: 'Google', m: 'Pixel 8' },
    'akita': { b: 'Google', m: 'Pixel 8a' },
    'caiman': { b: 'Google', m: 'Pixel 9 Pro' },
    'komodo': { b: 'Google', m: 'Pixel 9 Pro XL' },
    'tokay': { b: 'Google', m: 'Pixel 9' },
    'cheetah': { b: 'Google', m: 'Pixel 7 Pro' },
    'panther': { b: 'Google', m: 'Pixel 7' },
    'lynx': { b: 'Google', m: 'Pixel 7a' },
    'raven': { b: 'Google', m: 'Pixel 6 Pro' },
    'oriole': { b: 'Google', m: 'Pixel 6' },
    'bluejay': { b: 'Google', m: 'Pixel 6a' },
    // Xiaomi / POCO / Redmi
    'sweet': { b: 'Xiaomi', m: 'Redmi Note 10 Pro' },
    'sweetin': { b: 'Xiaomi', m: 'Redmi Note 10 Pro Max (India)' },
    'alioth': { b: 'POCO', m: 'POCO F3' },
    'vayu': { b: 'POCO', m: 'POCO X3 Pro' },
    'surya': { b: 'POCO', m: 'POCO X3 NFC' },
    'mido': { b: 'Xiaomi', m: 'Redmi Note 4' },
    'violet': { b: 'Xiaomi', m: 'Redmi Note 7 Pro' },
    'tissot': { b: 'Xiaomi', m: 'Mi A1' },
    'davinci': { b: 'Xiaomi', m: 'Redmi K20 / Mi 9T' },
    'raphael': { b: 'Xiaomi', m: 'Redmi K20 Pro / Mi 9T Pro' },
    'curtana': { b: 'Xiaomi', m: 'Redmi Note 9S' },
    'joyeuse': { b: 'Xiaomi', m: 'Redmi Note 9 Pro' },
    'gram': { b: 'Xiaomi', m: 'POCO M2 Pro' },
    'lisa': { b: 'Xiaomi', m: 'Xiaomi 11 Lite 5G NE' },
    'fuxi': { b: 'Xiaomi', m: 'Xiaomi 13' },
    'nuwa': { b: 'Xiaomi', m: 'Xiaomi 13 Pro' },
    'ishtar': { b: 'Xiaomi', m: 'Xiaomi 13 Ultra' },
    'houji': { b: 'Xiaomi', m: 'Xiaomi 14' },
    'shennong': { b: 'Xiaomi', m: 'Xiaomi 14 Pro' },
    // OnePlus
    'bacon': { b: 'OnePlus', m: 'OnePlus One' },
    'oneplus2': { b: 'OnePlus', m: 'OnePlus 2' },
    'onyx': { b: 'OnePlus', m: 'OnePlus X' },
    'oneplus3': { b: 'OnePlus', m: 'OnePlus 3 / 3T' },
    'cheeseburger': { b: 'OnePlus', m: 'OnePlus 5' },
    'dumpling': { b: 'OnePlus', m: 'OnePlus 5T' },
    'enchilada': { b: 'OnePlus', m: 'OnePlus 6' },
    'faye': { b: 'OnePlus', m: 'OnePlus 6T' },
    'guacamole': { b: 'OnePlus', m: 'OnePlus 7 Pro' },
    'guacamoleb': { b: 'OnePlus', m: 'OnePlus 7' },
    'hotdog': { b: 'OnePlus', m: 'OnePlus 7T Pro' },
    'hotdogb': { b: 'OnePlus', m: 'OnePlus 7T' },
    'instantnoodle': { b: 'OnePlus', m: 'OnePlus 8' },
    'instantnoodlep': { b: 'OnePlus', m: 'OnePlus 8 Pro' },
    'kebab': { b: 'OnePlus', m: 'OnePlus 8T' },
    'lemonade': { b: 'OnePlus', m: 'OnePlus 9' },
    'lemonadep': { b: 'OnePlus', m: 'OnePlus 9 Pro' },
    'waffle': { b: 'OnePlus', m: 'OnePlus 12' }
  };

  for (const [key, val] of Object.entries(manualOverrides)) {
    codenames[key] = val;
    models[key] = val;
  }

  const codenameKeys = Object.keys(codenames).length;
  const modelKeys = Object.keys(models).length;
  console.log(`Generated Database:`);
  console.log(`- Unique Codenames: ${codenameKeys}`);
  console.log(`- Unique Model Keys: ${modelKeys}`);

  const payload = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    totalDevices: count,
    codenames,
    models
  };

  const jsonString = JSON.stringify(payload);
  fs.writeFileSync(OUTPUT_FILE, jsonString, 'utf-8');

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`Successfully written to ${OUTPUT_FILE}`);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

buildDatabase().catch(err => {
  console.error('Build Error:', err);
  process.exit(1);
});
