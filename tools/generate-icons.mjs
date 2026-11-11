// Genera los iconos de la app (PNG + SVG) sin dependencias externas.
// Uso: node tools/generate-icons.mjs
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../icons/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const ACCENT = '#3049d6';
const WHITE = '#ffffff';
const SOFT = '#e3e8ff';
const NOW = '#e0452f';

// Diseño en una rejilla de 512×512. El contenido queda dentro de la zona segura
// de los iconos "maskable" (círculo central del 80 %).
const glyph = [
  { type: 'rrect', x0: 136, y0: 160, x1: 376, y1: 380, r: 30, color: WHITE },   // hoja del calendario
  { type: 'rrect', x0: 136, y0: 160, x1: 376, y1: 222, r: 30, color: SOFT },    // cabecera
  { type: 'rect', x0: 136, y0: 200, x1: 376, y1: 222, color: SOFT },
  { type: 'rrect', x0: 186, y0: 128, x1: 210, y1: 186, r: 12, color: WHITE },   // anillas
  { type: 'rrect', x0: 302, y0: 128, x1: 326, y1: 186, r: 12, color: WHITE },
  ...[0, 1, 2].flatMap(c => [0, 1].map(rw => ({                                // días
    type: 'circle', cx: 196 + c * 60, cy: 268 + rw * 60, r: 17,
    color: c === 2 && rw === 1 ? NOW : ACCENT,
  }))),
];

const background = rounded => rounded
  ? { type: 'rrect', x0: 0, y0: 0, x1: 512, y1: 512, r: 112, color: ACCENT }
  : { type: 'rect', x0: 0, y0: 0, x1: 512, y1: 512, color: ACCENT };

// ---------- Rasterizado con supersampling ----------
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));

function inside(s, x, y) {
  if (s.type === 'circle') return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r ** 2;
  if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1) return false;
  if (s.type === 'rect') return true;
  const cx = Math.min(Math.max(x, s.x0 + s.r), s.x1 - s.r);
  const cy = Math.min(Math.max(y, s.y0 + s.r), s.y1 - s.r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= s.r ** 2;
}

function rasterize(shapes, size, ss = 4) {
  const scale = 512 / size;
  const px = Buffer.alloc(size * size * 4);
  const cols = shapes.map(s => hex(s.color));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const X = (x + (sx + 0.5) / ss) * scale, Y = (y + (sy + 0.5) / ss) * scale;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (inside(shapes[i], X, Y)) { r += cols[i][0]; g += cols[i][1]; b += cols[i][2]; a++; break; }
          }
        }
      }
      const o = (y * size + x) * 4;
      if (a) { px[o] = r / a; px[o + 1] = g / a; px[o + 2] = b / a; }
      px[o + 3] = Math.round((a / (ss * ss)) * 255);
    }
  }
  return px;
}

// ---------- PNG ----------
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- SVG ----------
function svg(rounded) {
  const el = s => s.type === 'circle'
    ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.color}"/>`
    : `<rect x="${s.x0}" y="${s.y0}" width="${s.x1 - s.x0}" height="${s.y1 - s.y0}"${s.r ? ` rx="${s.r}"` : ''} fill="${s.color}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${[background(rounded), ...glyph].map(el).join('')}</svg>\n`;
}

const targets = [
  { file: 'icon-192.png', size: 192, rounded: true },
  { file: 'icon-512.png', size: 512, rounded: true },
  { file: 'maskable-192.png', size: 192, rounded: false },
  { file: 'maskable-512.png', size: 512, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, rounded: false }, // iOS redondea las esquinas
  { file: 'favicon-32.png', size: 32, rounded: true },
];
for (const t of targets) {
  writeFileSync(OUT + t.file, png(t.size, rasterize([background(t.rounded), ...glyph], t.size)));
  console.log('✓', t.file);
}
writeFileSync(OUT + 'icon.svg', svg(true));
console.log('✓ icon.svg');
