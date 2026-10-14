const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

const OUTPUT_DIR = path.resolve(__dirname, '../public/logo');
const ASSETS_DIR = path.resolve(__dirname, '../assets/logo');
const BUILD_DIR = path.resolve(__dirname, '../build');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });

function buildIco(images) {
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + (count * entrySize);

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // number of images

  const entries = [];
  const datas = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.data.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset

    entries.push(entry);
    datas.push(img.data);
    offset += img.data.length;
  }

  return Buffer.concat([header, ...entries, ...datas]);
}

app.whenReady().then(async () => {
  let win = null;
  const tempHtmlPath = path.join(__dirname, 'temp_render.html');

  try {
    console.log('Generating High-Resolution Logo Assets & Multi-Res Windows ICO...');

    win = new BrowserWindow({
      width: 2400,
      height: 750,
      useContentSize: true,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        offscreen: true
      }
    });

    const iconSvgContent = `
      <rect x="3" y="4.5" width="16" height="12" rx="2" />
      <line x1="11" y1="16.5" x2="11" y2="21" />
      <line x1="7" y1="21" x2="15" y2="21" />
      <rect x="22" y="8.5" width="7.5" height="13" rx="2" />
      <circle cx="25.75" cy="18.5" r="0.6" fill="currentColor" stroke="none" />
    `;

    const tasks = [
      {
        name: 'driverhub_logo_full.png',
        width: 2400,
        height: 600,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 2400px;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .container {
      display: flex;
      align-items: center;
      gap: 55px;
    }
    .icon {
      width: 330px;
      height: 330px;
      color: #16a34a;
    }
    .brand-text {
      font-size: 210px;
      font-weight: 850;
      letter-spacing: -2px;
      line-height: 1;
      text-transform: uppercase;
    }
    .green { color: #16a34a; }
    .slate { color: #0f172a; margin-left: 25px; }
  </style>
</head>
<body>
  <div class="container">
    <svg class="icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${iconSvgContent}
    </svg>
    <div class="brand-text">
      <span class="green">DRIVER</span><span class="slate">HUB</span>
    </div>
  </div>
</body>
</html>`
      },
      {
        name: 'driverhub_logo_with_tagline.png',
        width: 2400,
        height: 750,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 2400px;
      height: 750px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .container {
      display: flex;
      align-items: center;
      gap: 60px;
    }
    .icon {
      width: 360px;
      height: 360px;
      color: #16a34a;
    }
    .text-col {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .brand-text {
      font-size: 210px;
      font-weight: 850;
      letter-spacing: -2px;
      line-height: 1;
      text-transform: uppercase;
    }
    .tagline {
      font-size: 58px;
      font-weight: 500;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .green { color: #16a34a; }
    .slate { color: #0f172a; margin-left: 25px; }
  </style>
</head>
<body>
  <div class="container">
    <svg class="icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${iconSvgContent}
    </svg>
    <div class="text-col">
      <div class="brand-text">
        <span class="green">DRIVER</span><span class="slate">HUB</span>
      </div>
      <div class="tagline">All-in-one Android Driver Installer</div>
    </div>
  </div>
</body>
</html>`
      },
      {
        name: 'driverhub_icon_1024.png',
        width: 1024,
        height: 1024,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1024px;
      height: 1024px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    .icon {
      width: 780px;
      height: 780px;
      color: #16a34a;
    }
  </style>
</head>
<body>
  <svg class="icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    ${iconSvgContent}
  </svg>
</body>
</html>`
      },
      {
        name: 'driverhub_app_icon_squircle.png',
        width: 1024,
        height: 1024,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 1024px;
      height: 1024px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    .squircle {
      width: 820px;
      height: 820px;
      border-radius: 190px;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon {
      width: 520px;
      height: 520px;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="squircle">
    <svg class="icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${iconSvgContent}
    </svg>
  </div>
</body>
</html>`
      }
    ];

    let squircleImage = null;

    for (const task of tasks) {
      win.setSize(task.width, task.height);
      fs.writeFileSync(tempHtmlPath, task.html, 'utf8');
      await win.loadFile(tempHtmlPath);
      await new Promise(r => setTimeout(r, 800));

      const img = await win.webContents.capturePage({ x: 0, y: 0, width: task.width, height: task.height });
      const buf = img.toPNG();

      fs.writeFileSync(path.join(OUTPUT_DIR, task.name), buf);
      fs.writeFileSync(path.join(ASSETS_DIR, task.name), buf);
      console.log(`Saved: ${task.name} (${task.width}x${task.height})`);

      if (task.name === 'driverhub_app_icon_squircle.png') {
        squircleImage = img;
      }
    }

    // Save SVG file
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 220" fill="none">
  <g transform="translate(30, 35)">
    <svg width="150" height="150" viewBox="0 0 32 32" fill="none" stroke="#16a34a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${iconSvgContent}
    </svg>
  </g>
  <text x="210" y="145" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="95" font-weight="850" letter-spacing="-1">
    <tspan fill="#16a34a">DRIVER</tspan>
    <tspan fill="#0f172a" dx="20">HUB</tspan>
  </text>
</svg>`;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'driverhub_logo.svg'), svgContent, 'utf8');
    fs.writeFileSync(path.join(ASSETS_DIR, 'driverhub_logo.svg'), svgContent, 'utf8');
    console.log('Saved: driverhub_logo.svg');

    // Generate multi-resolution Windows ICO (16, 24, 32, 48, 64, 128, 256)
    if (squircleImage) {
      const icoSizes = [16, 24, 32, 48, 64, 128, 256];
      const icoImages = [];

      for (const size of icoSizes) {
        const resized = squircleImage.resize({ width: size, height: size, quality: 'high' });
        icoImages.push({ width: size, height: size, data: resized.toPNG() });
      }

      const icoBuffer = buildIco(icoImages);
      fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), icoBuffer);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.ico'), icoBuffer);
      fs.writeFileSync(path.join(ASSETS_DIR, 'icon.ico'), icoBuffer);
      fs.writeFileSync(path.join(BUILD_DIR, 'installerHeaderIcon.ico'), icoBuffer);
      console.log('Saved multi-resolution icon.ico (16, 24, 32, 48, 64, 128, 256) into build/, public/logo/, assets/logo/');
    }

    try { fs.unlinkSync(tempHtmlPath); } catch {}
    console.log('All Logo Assets and ICO files generated successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (win) win.destroy();
    app.quit();
  }
});
