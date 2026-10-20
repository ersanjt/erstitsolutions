import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "assets");
const fonts = path.join(root, "node_modules", "@fontsource", "unbounded", "files");

const VOID = "#05060a";
const TEXT = "#eceef3";
const ION = "#c6ff3a";
const BLUE = "#4d6bff";

function load(weight) {
  const read = (sub) => {
    const buf = fs.readFileSync(path.join(fonts, `unbounded-${sub}-${weight}-normal.woff`));
    return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  };
  return [read("latin"), read("latin-ext")];
}

function pathData(p) {
  const n = (v) => Number(v.toFixed(2));
  return p.commands
    .map((c) => {
      if (c.type === "M" || c.type === "L") return `${c.type}${n(c.x)} ${n(c.y)}`;
      if (c.type === "Q") return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      if (c.type === "C") return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return "Z";
    })
    .join("");
}

function textPath(faces, text, x, y, size, tracking = 0) {
  let cursor = x;
  const parts = [];
  for (const ch of text) {
    const face = faces.find((f) => f.charToGlyphIndex(ch) > 0) || faces[0];
    const glyph = face.charToGlyph(ch);
    parts.push(pathData(glyph.getPath(cursor, y, size)));
    cursor += (glyph.advanceWidth / face.unitsPerEm) * size + tracking * size;
  }
  return { d: parts.join(""), width: cursor - x - tracking * size };
}

const bold = load(700);
const heavy = load(800);
const regular = load(400);

const capOf = (faces) => faces[0].tables.os2.sCapHeight / faces[0].unitsPerEm;

function wordmark(fill) {
  const size = 100;
  const cap = capOf(bold) * size;
  const word = textPath(bold, "ERST", 0, cap, size, 0.02);
  const barW = size * 0.34;
  const barH = size * 0.13;
  const gap = size * 0.07;
  const width = Math.ceil(word.width + gap + barW);
  const height = Math.ceil(cap);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path fill="${fill}" d="${word.d}"/>
  <rect class="cursor" x="${(word.width + gap).toFixed(2)}" y="${(cap - barH).toFixed(2)}" width="${barW.toFixed(2)}" height="${barH.toFixed(2)}" fill="${ION}"/>
</svg>
`;
}

function mark({ rounded }) {
  const s = 512;
  const size = 360;
  const cap = capOf(heavy) * size;
  const e = textPath(heavy, "E", 0, 0, size);
  const barW = size * 0.24;
  const barH = size * 0.105;
  const gap = size * 0.05;
  const groupW = e.width + gap + barW;
  const x = (s - groupW) / 2;
  const y = (s + cap) / 2;
  const glyph = textPath(heavy, "E", x, y, size).d;
  const rx = rounded ? 104 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rx}" fill="${VOID}"/>
  <path fill="${TEXT}" d="${glyph}"/>
  <rect x="${(x + e.width + gap).toFixed(2)}" y="${(y - barH).toFixed(2)}" width="${barW.toFixed(2)}" height="${barH.toFixed(2)}" fill="${ION}"/>
</svg>
`;
}

function og() {
  const w = 1200;
  const h = 630;
  const size = 168;
  const cap = capOf(bold) * size;
  const word = textPath(bold, "ERST", 96, 250 + cap, size, 0.02);
  const barW = size * 0.34;
  const barH = size * 0.13;
  const lineA = textPath(regular, "Ajan hızında yazılım.", 100, 470, 40);
  const lineB = textPath(regular, "AI-native software studio · İstanbul", 100, 528, 22, 0.04);
  let grid = "";
  for (let gx = 0; gx <= w; gx += 60) grid += `<path d="M${gx} 0V${h}"/>`;
  for (let gy = 0; gy <= h; gy += 60) grid += `<path d="M0 ${gy}H${w}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="g1" cx="0.82" cy="0.3" r="0.55">
      <stop offset="0" stop-color="${ION}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${ION}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="0.68" cy="0.85" r="0.6">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${VOID}"/>
  <rect width="${w}" height="${h}" fill="url(#g2)"/>
  <rect width="${w}" height="${h}" fill="url(#g1)"/>
  <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1">${grid}</g>
  <path fill="${TEXT}" d="${word.d}"/>
  <rect x="${(96 + word.width + size * 0.07).toFixed(2)}" y="${(250 + cap - barH).toFixed(2)}" width="${barW.toFixed(2)}" height="${barH.toFixed(2)}" fill="${ION}"/>
  <path fill="${TEXT}" fill-opacity="0.86" d="${lineA.d}"/>
  <path fill="${ION}" d="${lineB.d}"/>
</svg>
`;
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const e = i * 16;
    dir[e] = img.size;
    dir[e + 1] = img.size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(img.png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += img.png.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.png)]);
}

const png = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();

const roundMark = mark({ rounded: true });
const squareMark = mark({ rounded: false });

fs.writeFileSync(path.join(out, "logo.svg"), wordmark(TEXT));
fs.writeFileSync(path.join(out, "logo-ink.svg"), wordmark(VOID));
fs.writeFileSync(path.join(out, "mark.svg"), roundMark);
fs.writeFileSync(path.join(root, "public", "favicon.svg"), roundMark);

const p16 = await png(roundMark, 16);
const p32 = await png(roundMark, 32);
const p48 = await png(roundMark, 48);
fs.writeFileSync(path.join(out, "favicon-16x16.png"), p16);
fs.writeFileSync(path.join(out, "favicon-32x32.png"), p32);
fs.writeFileSync(path.join(out, "favicon.ico"), ico([
  { size: 16, png: p16 },
  { size: 32, png: p32 },
  { size: 48, png: p48 },
]));
fs.writeFileSync(path.join(out, "apple-touch-icon.png"), await png(squareMark, 180));
fs.writeFileSync(path.join(out, "android-chrome-192x192.png"), await png(squareMark, 192));
fs.writeFileSync(path.join(out, "android-chrome-512x512.png"), await png(squareMark, 512));
await sharp(Buffer.from(og()), { density: 144 }).resize(1200, 630).png().toFile(path.join(out, "og.png"));

console.log("brand written");
