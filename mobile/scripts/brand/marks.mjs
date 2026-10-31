// Logo belgilari (200x200 koordinatalarda). Har bir funksiya SVG fragment qaytaradi.
export const C = {
  blue: '#3B82F6',
  yellow: '#FACC15',
  red: '#EF4444',
  green: '#22C55E',
  ink: '#1E1B4B',
  indigo: '#4F46E5',
};

let uid = 0;
const id = (p) => `${p}${++uid}`;

/**
 * Berilgan shaklni (clip path) 4 ta pazl bo'lagiga ajratadi.
 * cx/cy — bo'linish nuqtasi, knobs — har bo'lakning "tishchasi" markazi.
 */
function puzzleFill(shapePath, { cx, cy, gap = 5, r = 10, knobs, colors, shade = true }) {
  const clip = id('clip');
  const quads = [
    { x: -50, y: -50, w: cx + 50, h: cy + 50 }, // yuqori chap
    { x: cx, y: -50, w: 300, h: cy + 50 }, // yuqori o'ng
    { x: cx, y: cy, w: 300, h: 300 }, // pastki o'ng
    { x: -50, y: cy, w: cx + 50, h: 300 }, // pastki chap
  ];
  // Har bo'lak o'z tishchasiga ega, oldingi bo'lakning tishchasi unga kiradi
  let out = `<defs><clipPath id="${clip}"><path d="${shapePath}"/></clipPath>`;
  const masks = quads.map((q, i) => {
    const m = id('m');
    const own = knobs[i];
    const incoming = knobs[(i + 3) % 4];
    out += `<mask id="${m}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="300" height="300">
      <rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" fill="#fff"/>
      <line x1="${cx}" y1="-50" x2="${cx}" y2="250" stroke="#000" stroke-width="${gap}"/>
      <line x1="-50" y1="${cy}" x2="250" y2="${cy}" stroke="#000" stroke-width="${gap}"/>
      <circle cx="${own[0]}" cy="${own[1]}" r="${r}" fill="#fff"/>
      <circle cx="${incoming[0]}" cy="${incoming[1]}" r="${r + gap / 2}" fill="#000"/>
    </mask>`;
    return m;
  });
  if (shade) {
    colors.forEach((c, i) => {
      out += `<linearGradient id="g${clip}${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0.82"/></linearGradient>`;
    });
  }
  out += `</defs><g clip-path="url(#${clip})">`;
  masks.forEach((m, i) => {
    const fill = shade ? `url(#g${clip}${i})` : colors[i];
    out += `<rect x="-50" y="-50" width="300" height="300" fill="${fill}" mask="url(#${m})"/>`;
  });
  out += `</g>`;
  return out;
}

/** A. Pazl-yurak */
export const HEART_PATH =
  'M100 176 C 44 138, 16 106, 20 70 C 24 38, 62 22, 88 40 C 94 44, 98 49, 100 53 C 102 49, 106 44, 112 40 C 138 22, 176 38, 180 70 C 184 106, 156 138, 100 176 Z';

export function puzzleHeart({ colors = [C.blue, C.yellow, C.green, C.red], shade = true } = {}) {
  return puzzleFill(HEART_PATH, {
    cx: 100,
    cy: 98,
    gap: 6,
    r: 13,
    knobs: [
      [108, 72], // ko'k → sariq
      [146, 106], // sariq → yashil
      [92, 131], // yashil → qizil
      [52, 90], // qizil → ko'k
    ],
    colors,
    shade,
  });
}

/** B. Bosh profili (o'ngga qaragan) */
export const HEAD_PATH =
  'M70 186 L70 152 C 46 138, 34 114, 34 88 C 34 48, 66 18, 108 18 C 148 18, 174 46, 174 82 C 174 92, 172 99, 178 108 L 187 123 C 190 128, 187 132, 182 133 L 174 134 L 174 147 C 174 158, 165 165, 154 164 L 138 163 L 138 186 Z';

export function puzzleHead({ colors = [C.blue, C.yellow, C.green, C.red], shade = true } = {}) {
  return puzzleFill(HEAD_PATH, {
    cx: 104,
    cy: 96,
    gap: 6,
    r: 13,
    knobs: [
      [112, 64],
      [146, 104],
      [96, 131],
      [62, 88],
    ],
    colors,
    shade,
  });
}

/** C. Cheksizlik halqasi */
export function infinity({ stroke = 24 } = {}) {
  const g = id('inf');
  const path =
    'M100 100 C 120 70, 140 60, 158 60 C 182 60, 196 80, 196 100 C 196 120, 182 140, 158 140 C 140 140, 120 130, 100 100 C 80 70, 60 60, 42 60 C 18 60, 4 80, 4 100 C 4 120, 18 140, 42 140 C 60 140, 80 130, 100 100 Z';
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.red}"/><stop offset="0.33" stop-color="${C.yellow}"/>
      <stop offset="0.66" stop-color="${C.green}"/><stop offset="1" stop-color="${C.blue}"/>
    </linearGradient></defs>
    <g transform="translate(100 100) scale(0.88) translate(-100 -100)">
      <path d="${path}" fill="none" stroke="url(#${g})" stroke-width="${stroke}" stroke-linejoin="round"/>
    </g>`;
}

/** Yozuv: "autizm" to'q + "test" indigo, ixtiyoriy ".uz". */
export function wordmark({ x, y, size, dark = false, domain = false }) {
  const ink = dark ? '#FFFFFF' : C.ink;
  const accent = dark ? '#A5B4FC' : C.indigo;
  const muted = dark ? 'rgba(255,255,255,0.55)' : '#8A90A8';
  return `<text x="${x}" y="${y}" font-family="Manrope" font-weight="800" font-size="${size}" letter-spacing="${-size * 0.03}">
    <tspan fill="${ink}">autizm</tspan><tspan fill="${accent}">test</tspan>${domain ? `<tspan fill="${muted}" font-weight="600">.uz</tspan>` : ''}
  </text>`;
}
