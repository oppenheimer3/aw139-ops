import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');
const logoPath = join(__dirname, '..', 'public', 'GAPC.png');

const PNG_NAMES = [
  '32x32.png', '128x128.png', '128x128@2x.png',
  'icon.png',
  'Square30x30Logo.png', 'Square44x44Logo.png',
  'Square71x71Logo.png', 'Square89x89Logo.png',
  'Square107x107Logo.png', 'Square142x142Logo.png',
  'Square150x150Logo.png', 'Square284x284Logo.png',
  'Square310x310Logo.png', 'StoreLogo.png',
];

function createIco(pngBuffer) {
  const count = 1;
  const headerLen = 6;
  const entryLen = 16;
  const offset = headerLen + entryLen * count;
  const totalLen = offset + pngBuffer.length;
  const buf = Buffer.alloc(totalLen);

  let off = 0;
  // ICO header
  buf.writeUInt16LE(0, off); off += 2;   // reserved
  buf.writeUInt16LE(1, off); off += 2;   // type: icon
  buf.writeUInt16LE(count, off); off += 2; // count

  // ICO directory entry
  const w = pngBuffer[16];  // PNG IHDR width
  const h = pngBuffer[20];  // PNG IHDR height
  buf.writeUInt8(w === 256 ? 0 : w, off); off += 1;
  buf.writeUInt8(h === 256 ? 0 : h, off); off += 1;
  buf.writeUInt8(0, off); off += 1;       // color count
  buf.writeUInt8(0, off); off += 1;       // reserved
  buf.writeUInt16LE(1, off); off += 2;    // color planes
  buf.writeUInt16LE(32, off); off += 2;   // bits per pixel
  buf.writeUInt32LE(pngBuffer.length, off); off += 4; // size
  buf.writeUInt32LE(offset, off); off += 4; // offset

  // PNG data
  pngBuffer.copy(buf, off);

  return buf;
}

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

if (existsSync(logoPath)) {
  const logo = readFileSync(logoPath);
  for (const name of PNG_NAMES) {
    writeFileSync(join(iconsDir, name), logo);
    console.log(`Generated ${name} from GAPC.png`);
  }
  // Generate proper ICO file (PNG wrapped in ICO container)
  const ico = createIco(logo);
  writeFileSync(join(iconsDir, 'icon.ico'), ico);
  console.log('Generated icon.ico from GAPC.png');
} else {
  const fallback = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  for (const name of PNG_NAMES) {
    writeFileSync(join(iconsDir, name), fallback);
    console.log(`Generated ${name} (placeholder)`);
  }
  const ico = createIco(fallback);
  writeFileSync(join(iconsDir, 'icon.ico'), ico);
  console.log('Generated icon.ico (placeholder)');
}

console.log('All icons generated in', iconsDir);
