const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

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
  try {
    const sourcePath = path.resolve(__dirname, '../assets/logo/driverhub_app_icon_squircle.png');
    console.log('Loading high-resolution asset from:', sourcePath);
    
    const srcImg = nativeImage.createFromPath(sourcePath);
    const size = srcImg.getSize();
    console.log(`Original asset dimensions: ${size.width}x${size.height}`);

    const icoSizes = [16, 24, 32, 48, 64, 128, 256];
    const icoImages = [];

    for (const s of icoSizes) {
      const resized = srcImg.resize({ width: s, height: s, quality: 'best' });
      const pngBuf = resized.toPNG();
      icoImages.push({ width: s, height: s, data: pngBuf });
      console.log(`Rendered ${s}x${s} layer (${pngBuf.length} bytes)`);
    }

    const icoBuffer = buildIco(icoImages);

    const buildDir = path.resolve(__dirname, '../build');
    const publicLogoDir = path.resolve(__dirname, '../public/logo');
    const assetsLogoDir = path.resolve(__dirname, '../assets/logo');

    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
    fs.writeFileSync(path.join(buildDir, 'installerHeaderIcon.ico'), icoBuffer);
    fs.writeFileSync(path.join(publicLogoDir, 'icon.ico'), icoBuffer);
    fs.writeFileSync(path.join(assetsLogoDir, 'icon.ico'), icoBuffer);

    console.log('Successfully created multi-resolution icon.ico from original high-quality asset!');
  } catch (err) {
    console.error('Error generating ICO:', err);
  } finally {
    app.quit();
  }
});
