import { infinity, puzzleHead, puzzleHeart, wordmark } from './marks.mjs';
import { render } from './render.mjs';

// Har konsepsiya uchun qator: oq fonda belgi, ilova ikonkasi, gorizontal lockup, to'q fonda lockup
const concepts = [
  { key: 'A', title: 'A — Pazl-yurak', mark: () => puzzleHeart() },
  { key: 'B', title: 'B — Bosh-pazl', mark: () => puzzleHead() },
  { key: 'C', title: 'C — Cheksizlik', mark: () => infinity() },
];

const W = 1800;
const ROW = 420;
const H = 120 + ROW * concepts.length;

const place = (mark, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 200})">${mark}</g>`;

let body = `<rect width="${W}" height="${H}" fill="#F5F6FB"/>
  <text x="60" y="78" font-family="Manrope" font-weight="800" font-size="40" fill="#1E1B4B">autizmtest.uz — logo konsepsiyalari</text>`;

concepts.forEach((c, i) => {
  const y = 120 + i * ROW;
  body += `<text x="60" y="${y + 40}" font-family="Manrope" font-weight="800" font-size="28" fill="#5B6178">${c.title}</text>`;
  // 1. Belgi oq kartada
  body += `<rect x="60" y="${y + 64}" width="300" height="300" rx="36" fill="#FFFFFF"/>`;
  body += place(c.mark(), 90, y + 94, 240);
  // 2. Ilova ikonkasi (indigo gradient, oq belgi ostida yumshoq halo)
  body += `<defs><linearGradient id="bg${c.key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF0FF"/></linearGradient></defs>`;
  body += `<rect x="400" y="${y + 64}" width="300" height="300" rx="68" fill="url(#bg${c.key})" stroke="#E4E7F1" stroke-width="2"/>`;
  body += place(c.mark(), 445, y + 109, 210);
  // 3. Gorizontal lockup oq fonda
  body += `<rect x="740" y="${y + 64}" width="500" height="300" rx="36" fill="#FFFFFF"/>`;
  body += place(c.mark(), 770, y + 164, 100);
  body += wordmark({ x: 884, y: y + 236, size: 56 });
  body += `<text x="886" y="${y + 272}" font-family="Manrope" font-weight="600" font-size="20" fill="#8A90A8">Bolangiz rivojlanishi uchun</text>`;
  // 4. To'q fonda lockup
  body += `<rect x="1280" y="${y + 64}" width="460" height="300" rx="36" fill="#141729"/>`;
  body += place(c.mark(), 1306, y + 168, 92);
  body += wordmark({ x: 1408, y: y + 230, size: 42, dark: true, domain: true });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
render(svg, process.argv[2] ?? new URL('../../assets/brand/logo-concepts.png', import.meta.url).pathname);
console.log('ok');
