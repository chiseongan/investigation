// 수업용 QR 코드를 만든다.
//   node scripts/make-qr.mjs                      → 기본 주소(GitHub Pages)
//   node scripts/make-qr.mjs https://내주소/      → 다른 주소
// 결과: qr/qr.svg, qr/qr.png, qr/print.html (인쇄하거나 슬라이드에 붙여 넣기)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const url = process.argv[2] ?? 'https://chiseongan.github.io/investigation/';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'qr');
fs.mkdirSync(dir, { recursive: true });

const opts = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#1F2A44', light: '#FFFFFF' } };
fs.writeFileSync(path.join(dir, 'qr.svg'), await QRCode.toString(url, { ...opts, type: 'svg' }));
await QRCode.toFile(path.join(dir, 'qr.png'), url, { ...opts, width: 1024 });

fs.writeFileSync(
  path.join(dir, 'print.html'),
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>잠입 수사 QR</title>
<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:'Malgun Gothic',system-ui,sans-serif;color:#1F2A44}
img{width:min(80vw,420px)}h1{margin:0;font-size:28px}p{margin:0;font-size:16px;word-break:break-all;text-align:center;padding:0 16px}</style></head>
<body><h1>잠입 수사: 2학년 2반의 일주일</h1><img src="qr.svg" alt="게임 주소 QR 코드"><p>${url}</p><p>휴대폰 카메라로 QR을 비추세요</p></body></html>
`,
);
console.log('QR 주소:', url);
console.log('만든 파일: qr/qr.svg, qr/qr.png, qr/print.html');
