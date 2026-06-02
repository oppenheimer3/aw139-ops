import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');

const ICONS = [
  '32x32.png', '128x128.png', '128x128@2x.png', 'icon.ico',
  'icon.png', 'Square30x30Logo.png', 'Square44x44Logo.png',
  'Square71x71Logo.png', 'Square89x89Logo.png', 'Square107x107Logo.png',
  'Square142x142Logo.png', 'Square150x150Logo.png', 'Square284x284Logo.png',
  'Square310x310Logo.png', 'StoreLogo.png',
];

// Minimal 1x1 dark-teal PNG (base64)
const BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const PNG_BUF = Buffer.from(BASE64, 'base64');

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

for (const name of ICONS) {
  writeFileSync(join(iconsDir, name), PNG_BUF);
  console.log(`Generated ${name}`);
}

console.log('All icons generated in', iconsDir);
