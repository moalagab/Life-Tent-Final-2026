/**
 * Generates PWA icon PNGs using fast-png (already a transitive dep).
 * Run: node scripts/generate-pwa-icons.mjs
 *
 * Produces:
 *   public/pwa-512x512.png
 *   public/pwa-192x192.png
 *   public/apple-touch-icon.png
 */

import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { encode } = require('fast-png');

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ── Colours ──────────────────────────────────────────────────────────────────
const BG_R = 15, BG_G = 15, BG_B = 30;           // #0f0f1e  deep navy
const RI_R = 26, RI_G = 26, RI_B = 60;           // #1a1a3c  outer ring
const GO_R = 217, GO_G = 119, GO_B = 6;          // #D97706  gold
const HL_R = 251, HL_G = 191, HL_B = 36;         // #FBBF24  gold highlight
const DO_R = 10,  DO_G = 10,  DO_B = 24;          // door hole dark

// ── Pixel ops ─────────────────────────────────────────────────────────────────
function setPixel(data, size, px, py, r, g, b) {
  const x = px | 0, y = py | 0;
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const i = (y * size + x) * 4;
  data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
}

function fillRect(data, size, x1, y1, x2, y2, r, g, b) {
  for (let y = y1|0; y <= (y2|0); y++)
    for (let x = x1|0; x <= (x2|0); x++)
      setPixel(data, size, x, y, r, g, b);
}

function fillCircle(data, size, cx, cy, radius, r, g, b) {
  const r2 = radius * radius;
  const x0 = (cx - radius) | 0, x1 = (cx + radius + 1) | 0;
  const y0 = (cy - radius) | 0, y1 = (cy + radius + 1) | 0;
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      if (dx*dx + dy*dy <= r2) setPixel(data, size, x, y, r, g, b);
    }
  }
}

function fillTriangle(data, size, ax, ay, bx, by, cx2, cy2, r, g, b) {
  // sort by y
  let pts = [[ax,ay],[bx,by],[cx2,cy2]].sort((a,b2) => a[1]-b2[1]);
  const [[x0,y0],[x1,y1],[x2,y2]] = pts;
  for (let y = (y0|0); y <= (y2|0); y++) {
    const tAC = y2 === y0 ? 0 : (y - y0) / (y2 - y0);
    const lx = x0 + (x2 - x0) * tAC;
    let rx;
    if (y <= y1) {
      const tAB = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      rx = x0 + (x1 - x0) * tAB;
    } else {
      const tBC = y2 === y1 ? 0 : (y - y1) / (y2 - y1);
      rx = x1 + (x2 - x1) * tBC;
    }
    const left = Math.min(lx, rx) | 0, right = Math.max(lx, rx) | 0;
    for (let x = left; x <= right; x++)
      setPixel(data, size, x, y, r, g, b);
  }
}

function strokeLine(data, size, x1, y1, x2, y2, r, g, b, w) {
  const half = (w / 2) | 0;
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy, cx3 = x1|0, cy3 = y1|0;
  const x2i = x2|0, y2i = y2|0;
  while (true) {
    for (let ty = -half; ty <= half; ty++)
      for (let tx = -half; tx <= half; tx++)
        setPixel(data, size, cx3+tx, cy3+ty, r, g, b);
    if (cx3 === x2i && cy3 === y2i) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx3 += sx; }
    if (e2 <  dx) { err += dx; cy3 += sy; }
  }
}

// ── Draw icon ─────────────────────────────────────────────────────────────────
function drawIcon(size) {
  const data = new Uint8Array(size * size * 4);
  // fill background
  for (let i = 0; i < size * size; i++) {
    data[i*4] = BG_R; data[i*4+1] = BG_G; data[i*4+2] = BG_B; data[i*4+3] = 255;
  }

  const S = (n) => Math.round(n * size / 512); // scale from 512-base

  // Background circle
  fillCircle(data, size, S(256), S(256), S(240), RI_R, RI_G, RI_B);

  // Tent roof (gold triangle)
  fillTriangle(data, size,
    S(256), S(100),   // apex
    S(80),  S(340),   // bottom-left
    S(432), S(340),   // bottom-right
    GO_R, GO_G, GO_B
  );

  // Tent body (wall below roof)
  fillRect(data, size, S(140), S(340), S(372), S(430), 40, 40, 80);

  // Door (dark rectangle + semicircle arch)
  const dX1 = S(200), dX2 = S(312), dY1 = S(365), dY2 = S(430);
  fillRect(data, size, dX1, dY1, dX2, dY2, DO_R, DO_G, DO_B);
  fillCircle(data, size, (dX1+dX2)/2, dY1, (dX2-dX1)/2, DO_R, DO_G, DO_B);

  // Centre pole (white)
  const pw = Math.max(2, S(4));
  strokeLine(data, size, S(256), S(100), S(256), S(430), 255, 255, 255, pw);

  // Roof edge highlight
  const hw = Math.max(1, S(3));
  strokeLine(data, size, S(256), S(100), S(80),  S(340), HL_R, HL_G, HL_B, hw);
  strokeLine(data, size, S(256), S(100), S(432), S(340), HL_R, HL_G, HL_B, hw);

  return encode({ width: size, height: size, data, channels: 4 });
}

// ── Write files ───────────────────────────────────────────────────────────────
const icons = [
  { file: 'pwa-512x512.png',      size: 512 },
  { file: 'pwa-192x192.png',      size: 192 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of icons) {
  const png = drawIcon(size);
  writeFileSync(join(publicDir, file), png);
  console.log(`✓ public/${file}  (${size}×${size})`);
}

console.log('\nDone. All PWA icons written to public/');
