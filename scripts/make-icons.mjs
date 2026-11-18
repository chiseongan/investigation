// 앱 아이콘(PNG)을 만든다. 외부 의존성 없음: node scripts/make-icons.mjs
// 남색 바탕에 주황색 돋보기. 마스커블 아이콘은 안전 영역(가운데 80%) 안에 그린다.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });

const BG = [0x1f, 0x2a, 0x44];
const FG = [0xe8, 0xa3, 0x3d];
const LENS = [0x3b, 0x6f, 0xd8];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, scale) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const SS = 3; // 3x3 슈퍼샘플링
  const c = 0.5 - 0.06 * scale; // 렌즈 중심 (정규화 좌표)
  const cx = c, cy = c;
  const r = 0.22 * scale;
  const sw = 0.07 * scale;
  const h0 = [cx + r * 0.72, cy + r * 0.72];
  const h1 = [0.5 + 0.28 * scale, 0.5 + 0.28 * scale];
  const hw = 0.085 * scale;
  const segDist = (px, py) => {
    const dx = h1[0] - h0[0], dy = h1[1] - h0[1];
    const t = Math.max(0, Math.min(1, ((px - h0[0]) * dx + (py - h0[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (h0[0] + t * dx), py - (h0[1] + t * dy));
  };
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let rr = 0, gg = 0, bb = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = (x + (sx + 0.5) / SS) / size;
        const py = (y + (sy + 0.5) / SS) / size;
        const d = Math.hypot(px - cx, py - cy);
        let col = BG;
        if (d < r - sw / 2) col = LENS.map((v, i) => Math.round(v * 0.55 + BG[i] * 0.45));
        if (Math.abs(d - r) <= sw / 2 || segDist(px, py) <= hw / 2) col = FG;
        rr += col[0]; gg += col[1]; bb += col[2];
      }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = Math.round(rr / (SS * SS));
      raw[o + 1] = Math.round(gg / (SS * SS));
      raw[o + 2] = Math.round(bb / (SS * SS));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const jobs = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['maskable-512.png', 512, 0.8],
  ['apple-touch-icon.png', 180, 1],
];
for (const [name, size, scale] of jobs) {
  fs.writeFileSync(path.join(out, name), png(size, scale));
  console.log('만듦:', name);
}
