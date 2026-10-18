import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "assets");
fs.mkdirSync(out, { recursive: true });

const INK = [0x14, 0x14, 0x14, 255];
const BONE = [0xef, 0xec, 0xe6, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ico(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const parts = [header, dir];
  images.forEach((img, i) => {
    const e = i * 16;
    dir[e] = img.size >= 256 ? 0 : img.size;
    dir[e + 1] = img.size >= 256 ? 0 : img.size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(img.png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += img.png.length;
    parts.push(img.png);
  });
  return Buffer.concat(parts);
}

function insideRound(x, y, s, r) {
  if (x < 0 || y < 0 || x > s || y > s) return false;
  const cx = Math.min(Math.max(x, r), s - r);
  const cy = Math.min(Math.max(y, r), s - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideE(x, y, s) {
  const pad = s * 0.22;
  const t = Math.max(s * 0.115, 1);
  const x0 = pad;
  const y0 = pad;
  const x1 = s - pad;
  const y1 = s - pad;
  const midY = (y0 + y1 - t) / 2;
  const midX = x0 + (x1 - x0) * 0.68;
  const stem = x >= x0 && x <= x0 + t && y >= y0 && y <= y1;
  const top = x >= x0 && x <= x1 && y >= y0 && y <= y0 + t;
  const bot = x >= x0 && x <= x1 && y >= y1 - t && y <= y1;
  const mid = x >= x0 && x <= midX && y >= midY && y <= midY + t;
  return stem || top || bot || mid;
}

function render(size, { fullBleed }) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = fullBleed ? 0 : size * 0.22;
  const n = size >= 64 ? 3 : 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let tile = 0;
      let letter = 0;
      const samples = n * n;
      for (let sy = 0; sy < n; sy++) {
        for (let sx = 0; sx < n; sx++) {
          const px = x + (sx + 0.5) / n;
          const py = y + (sy + 0.5) / n;
          const onTile = fullBleed || insideRound(px, py, size, radius);
          if (onTile) tile++;
          if (onTile && insideE(px, py, size)) letter++;
        }
      }
      const i = (y * size + x) * 4;
      const tileA = tile / samples;
      const letterA = letter / samples;
      const bgA = tileA * (1 - letterA);
      const a = Math.min(1, bgA + letterA);
      if (a <= 0) continue;
      const r = (INK[0] * bgA + BONE[0] * letterA) / a;
      const g = (INK[1] * bgA + BONE[1] * letterA) / a;
      const b = (INK[2] * bgA + BONE[2] * letterA) / a;
      rgba[i] = Math.round(r);
      rgba[i + 1] = Math.round(g);
      rgba[i + 2] = Math.round(b);
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return png(size, rgba);
}

const sizes = [
  ["favicon-16x16.png", 16, false],
  ["favicon-32x32.png", 32, false],
  ["apple-touch-icon.png", 180, true],
  ["android-chrome-192x192.png", 192, true],
  ["android-chrome-512x512.png", 512, true],
];

const pngs = {};
for (const [name, size, fullBleed] of sizes) {
  const file = render(size, { fullBleed });
  fs.writeFileSync(path.join(out, name), file);
  pngs[size] = file;
}

fs.writeFileSync(
  path.join(out, "favicon.ico"),
  ico([
    { size: 16, png: pngs[16] },
    { size: 32, png: pngs[32] },
  ]),
);

const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="12" fill="#141414"/>
  <path fill="#efece6" d="M11 11h26v6H17v4h10v6H17v4h20v6H11z"/>
</svg>
`;
const markOnDark = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="12" fill="#f3f0e7"/>
  <path fill="#141414" d="M11 11h26v6H17v4h10v6H17v4h20v6H11z"/>
</svg>
`;
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 248 48">
  <rect width="48" height="48" rx="12" fill="#141414"/>
  <path fill="#efece6" d="M11 11h26v6H17v4h10v6H17v4h20v6H11z"/>
  <text x="60" y="33" fill="#141414" font-family="Syne, Outfit, sans-serif" font-size="26" font-weight="700" letter-spacing="1.5">ERST</text>
  <text x="152" y="33" fill="#0f7a45" font-family="Syne, Outfit, sans-serif" font-size="26" font-weight="700" letter-spacing="1.5">IT</text>
</svg>
`;

fs.writeFileSync(path.join(out, "mark.svg"), mark);
fs.writeFileSync(path.join(out, "mark-on-dark.svg"), markOnDark);
fs.writeFileSync(path.join(out, "logo.svg"), logo);
fs.writeFileSync(path.join(root, "public", "favicon.svg"), mark);
console.log("icons written");
