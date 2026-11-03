// Genera iconos PNG de la PWA desde un SVG (sin assets externos). Uso: npm run icons
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#F2704F"/>
<g fill="#fff"><rect x="96" y="212" width="40" height="88" rx="12"/><rect x="146" y="180" width="44" height="152" rx="14"/>
<rect x="190" y="238" width="132" height="36" rx="10"/>
<rect x="322" y="180" width="44" height="152" rx="14"/><rect x="376" y="212" width="40" height="88" rx="12"/></g></svg>`;
writeFileSync(resolve(pub, 'icon.svg'), svg);
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]])
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(resolve(pub, name));
console.log('iconos OK');
