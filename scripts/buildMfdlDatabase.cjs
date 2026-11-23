const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Try reading cached HTML or fetch live
async function getMfdlData() {
  const localCache = path.resolve(__dirname, '../scratch/output_step6075.txt');
  const tempPath = 'C:\\Users\\sharm\\.gemini\\antigravity\\brain\\fbb65468-31bf-45fb-97ab-7b4bd203c7a6\\.system_generated\\steps\\6075\\output.txt';
  
  let html = '';
  if (fs.existsSync(tempPath)) {
    html = fs.readFileSync(tempPath, 'utf8');
  } else if (fs.existsSync(localCache)) {
    html = fs.readFileSync(localCache, 'utf8');
  } else {
    console.log('Fetching live from mfdl.io...');
    const https = require('https');
    html = await new Promise((resolve, reject) => {
      https.get('https://www.mfdl.io/', res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(d));
      }).on('error', reject);
    });
  }

  const match = html.match(/DEV_DATA_B64=(?:&#x27;|'|")([^'"]+)(?:&#x27;|'|")/);
  if (!match) throw new Error('Could not find DEV_DATA_B64');
  
  const b64 = match[1].replace(/&#x27;/g, '');
  const buf = Buffer.from(b64, 'base64');
  const jsonStr = zlib.inflateSync(buf).toString('utf8');
  return JSON.parse(jsonStr);
}

async function run() {
  console.log('Parsing MFDL device specifications database...');
  const db = await getMfdlData();
  
  const targetDir = path.resolve(__dirname, '../electron/data');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, 'mfdl_device_db.json');
  fs.writeFileSync(targetPath, JSON.stringify(db));
  
  const stats = fs.statSync(targetPath);
  console.log(`Saved mfdl_device_db.json (${stats.size} bytes) across ${Object.keys(db).length} brands.`);
}

run().catch(err => {
  console.error('Error building MFDL database:', err);
  process.exit(1);
});
