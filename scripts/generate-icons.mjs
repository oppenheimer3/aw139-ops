import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');
const logoPath = join(__dirname, '..', 'public', 'GAPC.png');

const ICONS = [
  '32x32.png', '128x128.png', '128x128@2x.png',
  'icon.png',
  'Square30x30Logo.png', 'Square44x44Logo.png',
  'Square71x71Logo.png', 'Square89x89Logo.png',
  'Square107x107Logo.png', 'Square142x142Logo.png',
  'Square150x150Logo.png', 'Square284x284Logo.png',
  'Square310x310Logo.png', 'StoreLogo.png',
];

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

if (existsSync(logoPath)) {
  const logo = readFileSync(logoPath);
  for (const name of ICONS) {
    writeFileSync(join(iconsDir, name), logo);
    console.log(`Generated ${name} from GAPC.png`);
  }
} else {
  // Fallback: 1x1 dark-teal PNG
  const fallback = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  for (const name of ICONS) {
    writeFileSync(join(iconsDir, name), fallback);
    console.log(`Generated ${name} (placeholder)`);
  }
}

console.log('All icons generated in', iconsDir);
