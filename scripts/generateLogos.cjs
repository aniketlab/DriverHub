const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

const OUTPUT_DIR = path.resolve(__dirname, '../public/logo');
const ASSETS_DIR = path.resolve(__dirname, '../assets/logo');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

app.whenReady().then(async () => {
  let win = null;
  const tempHtmlPath = path.join(__dirname, 'temp_render.html');

  try {
    console.log('Generating High-Resolution Logo Assets...');

    win = new BrowserWindow({
      width: 2400,
      height: 750,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        offscreen: true
      }
    });

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
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
      <path d="M10 19v-4" />
      <path d="M7 19h5" />
      <rect width="6" height="10" x="16" y="12" rx="2" />
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
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
      <path d="M10 19v-4" />
      <path d="M7 19h5" />
      <rect width="6" height="10" x="16" y="12" rx="2" />
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
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
    <path d="M10 19v-4" />
    <path d="M7 19h5" />
    <rect width="6" height="10" x="16" y="12" rx="2" />
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1024px;
      height: 1024px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    .squircle {
      width: 960px;
      height: 960px;
      border-radius: 220px;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 40px 100px rgba(22, 163, 74, 0.4);
    }
    .icon {
      width: 580px;
      height: 580px;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="squircle">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
      <path d="M10 19v-4" />
      <path d="M7 19h5" />
      <rect width="6" height="10" x="16" y="12" rx="2" />
    </svg>
  </div>
</body>
</html>`
      }
    ];

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
    }

    // Save SVG file
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 220" fill="none">
  <g transform="translate(30, 35)">
    <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"/>
      <path d="M10 19v-4"/>
      <path d="M7 19h5"/>
      <rect width="6" height="10" x="16" y="12" rx="2"/>
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

    try { fs.unlinkSync(tempHtmlPath); } catch {}
    console.log('All Logo Assets generated successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (win) win.destroy();
    app.quit();
  }
});
