import { mkdirSync, writeFileSync } from 'node:fs';
import { C, puzzleHeart, wordmark } from './marks.mjs';
import { render } from './render.mjs';

import { fileURLToPath } from 'node:url';

// Ishga tushirish: mobile/ papkada `node scripts/brand/assets.mjs`
const MOBILE = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const IMG = `${MOBILE}/assets/images`;
const BRAND = `${MOBILE}/assets/brand`;
mkdirSync(BRAND, { recursive: true });

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
// Yurak 200x200 qutida markazga yaqin (vizual markaz y≈99)
const mark = (size, cx, cy, opts) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 200})">${puzzleHeart(opts)}</g>`;
const softBg = (w, h) =>
  `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9ECFF"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`;

// iOS / umumiy ilova ikonkasi (shaffofsiz)
render(svg(1024, 1024, softBg(1024, 1024) + mark(640, 512, 520)), `${IMG}/icon.png`);
// Android adaptive: oldingi qatlam (xavfsiz zona ichida), fon va monoxrom
render(svg(1024, 1024, mark(540, 512, 518)), `${IMG}/android-icon-foreground.png`);
render(svg(1024, 1024, softBg(1024, 1024)), `${IMG}/android-icon-background.png`);
render(svg(1024, 1024, mark(540, 512, 518, { colors: ['#fff', '#fff', '#fff', '#fff'], shade: false })), `${IMG}/android-icon-monochrome.png`);
// Splash va favicon
render(svg(1024, 1024, mark(1024, 512, 512)), `${IMG}/splash-icon.png`);
render(svg(196, 196, mark(180, 98, 100)), `${IMG}/favicon.png`, 48);

// Brend fayllari: belgi (SVG + PNG), gorizontal lockup oq va to'q fonda
const markSvg = svg(200, 200, puzzleHeart());
writeFileSync(`${BRAND}/logo-mark.svg`, markSvg);
render(markSvg, `${BRAND}/logo-mark.png`, 1024);
const lockup = (dark) =>
  svg(
    1200,
    300,
    `${dark ? '<rect width="1200" height="300" fill="#141729"/>' : ''}${mark(220, 150, 150)}${wordmark({ x: 290, y: 190, size: 124, dark, domain: true })}`,
  );
render(lockup(false), `${BRAND}/logo-horizontal.png`, 2400);
render(lockup(true), `${BRAND}/logo-horizontal-dark.png`, 2400);
render(svg(1024, 1024, softBg(1024, 1024) + mark(640, 512, 520)), `${BRAND}/app-store-icon.png`);

// Ilova ichida react-native-svg (SvgXml) bilan chiziladigan belgi
writeFileSync(
  `${MOBILE}/src/constants/brand-mark.ts`,
  `// Avtomatik yaratilgan: logo belgisi (pazl-yurak), viewBox 0 0 200 200.\nexport const BRAND_MARK_SVG = ${JSON.stringify(markSvg)};\n`,
);
console.log('ok', C.indigo);
