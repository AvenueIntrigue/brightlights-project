import QRCode from 'qrcode';
import sharp from 'sharp';

const url = 'https://brightlightscreative.com';

const size = 600;
const cornerRadius = 80; // Adjust: 50 subtle, 120 bold, 300 for full circle

QRCode.toBuffer(url, {
  width: size,
  margin: 4,
  color: { dark: '#FFFFFF', light: '#00000000' } // Transparent background!
})
.then(async (qrBuffer) => {
  const maskSvg = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
    </svg>
  `);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 } // Solid black
    }
  })
  .composite([
    { input: qrBuffer, blend: 'over' },     // Overlay white QR modules
    { input: maskSvg, blend: 'dest-in' }    // Apply rounded mask last
  ])
  .png()
  .toFile('dist/assets/website_qr_rounded.png');

  console.log('Fixed rounded QR generated: assets/website_qr_rounded.png');
})
.catch(err => console.error('Error:', err));