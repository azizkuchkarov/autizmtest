import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { puzzleHeart, wordmark } from './marks.mjs';
import { render } from './render.mjs';

// Ishga tushirish: mobile/ papkada `node scripts/brand/web.mjs` — sayt uchun logo va ikonkalar
const ROOT = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');
const APP = `${ROOT}/src/app`;
const PUB = `${ROOT}/public/brand`;
const TMP = `${ROOT}/mobile/node_modules/.cache/brand`;
mkdirSync(PUB, { recursive: true });
mkdirSync(TMP, { recursive: true });

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const mark = (size, cx, cy) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 200})">${puzzleHeart()}</g>`;

// Logo belgisi (SVG) — sayt sahifalarida <img> orqali
const markSvg = svg(200, 200, puzzleHeart());
writeFileSync(`${PUB}/logo-mark.svg`, markSvg);
// Brauzer yorlig'i uchun ikonka (Next.js icon.svg konvensiyasi)
writeFileSync(`${APP}/icon.svg`, markSvg);

// Gorizontal logo (oq va to'q fon)
const lockup = (dark) =>
  svg(1200, 300, `${dark ? '<rect width="1200" height="300" fill="#141729"/>' : ''}${mark(220, 150, 150)}${wordmark({ x: 290, y: 190, size: 124, dark, domain: true })}`);
render(lockup(false), `${PUB}/logo-horizontal.png`, 1200);
render(lockup(true), `${PUB}/logo-horizontal-dark.png`, 1200);

// Apple touch icon: oq fonda, chetlarida bo'sh joy bilan
render(svg(180, 180, `<rect width="180" height="180" fill="#FFFFFF"/>${mark(124, 90, 92)}`), `${APP}/apple-icon.png`);

// Ijtimoiy tarmoqlarda ulashish rasmi (1200x630)
const og = svg(
  1200,
  630,
  `<defs><linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9ECFF"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#og)"/>
  ${mark(250, 600, 215)}
  ${wordmark({ x: 600, y: 440, size: 92, domain: true }).replace('<text ', '<text text-anchor="middle" ')}
  <text x="600" y="512" text-anchor="middle" font-family="Manrope" font-weight="600" font-size="34" fill="#5B6178">Bolalar rivojlanishi uchun autizm skriningi</text>`,
);
render(og, `${APP}/opengraph-image.png`);

// favicon.ico: 16, 32 va 48 px PNG'lar bitta ICO faylda
const sizes = [16, 32, 48];
const pngs = sizes.map((s) => {
  const p = `${TMP}/fav-${s}.png`;
  render(svg(200, 200, `<g transform="translate(4 6) scale(0.96)">${puzzleHeart({ shade: false })}</g>`), p, s);
  return readFileSync(p);
});
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0);
  e.writeUInt8(s, 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
writeFileSync(`${APP}/favicon.ico`, Buffer.concat([header, ...entries, ...pngs]));
console.log('ok');
