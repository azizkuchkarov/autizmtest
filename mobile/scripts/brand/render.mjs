import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

const FONTS = fileURLToPath(new URL('../../node_modules/@expo-google-fonts/manrope', import.meta.url));

/** SVG matnini PNG faylga aylantiradi (Manrope shrifti bilan). */
export function render(svg, outPath, width) {
  const resvg = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: {
      fontFiles: [`${FONTS}/800ExtraBold/Manrope_800ExtraBold.ttf`, `${FONTS}/600SemiBold/Manrope_600SemiBold.ttf`],
      loadSystemFonts: false,
      defaultFontFamily: 'Manrope',
    },
  });
  writeFileSync(outPath, resvg.render().asPng());
}
