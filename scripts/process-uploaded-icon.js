const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = 'C:/Users/Apurbo Khan/.gemini/antigravity/brain/fde19f56-0bc1-42d0-9dfe-2a113dce225c/.user_uploaded/media_1789305315401.jpg';
const outputDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

async function processIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Crop slightly (zoom in) to frame the hand and tasbih beads perfectly
  // Source is 626x626. Extract 490x490 starting from left: 65, top: 85
  const croppedBuffer = await sharp(inputPath)
    .extract({ left: 65, top: 85, width: 490, height: 490 })
    .toBuffer();

  // 1. icon-512.png (512x512 PNG)
  await sharp(croppedBuffer)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'icon-512.png'));

  // 2. icon-192.png (192x192 PNG)
  await sharp(croppedBuffer)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'icon-192.png'));

  // 3. icon-maskable.png (512x512 with safe-zone padding)
  await sharp(croppedBuffer)
    .resize(420, 420, { fit: 'cover' })
    .extend({
      top: 46,
      bottom: 46,
      left: 46,
      right: 46,
      background: { r: 254, g: 247, b: 236, alpha: 1 },
    })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'icon-maskable.png'));

  // 4. icon.svg
  const pngBase64 = (await sharp(croppedBuffer).resize(512, 512).png().toBuffer()).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${pngBase64}" width="512" height="512" />
</svg>`;
  fs.writeFileSync(path.join(outputDir, 'icon.svg'), svgContent);

  // 5. favicon.ico
  const faviconBuffer = await sharp(croppedBuffer)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);

  // 6. apple-touch-icon.png (180x180 for iOS Home Screen)
  await sharp(croppedBuffer)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 7. favicon-32x32.png
  await sharp(croppedBuffer)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  console.log('SUCCESS: All mobile PWA app icons and web favicons generated successfully!');
}

processIcons().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
