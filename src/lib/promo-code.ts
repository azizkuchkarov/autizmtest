/** Promokod formati: DEMO-XXXXXXXX (A-Z0-9) */
export function generatePromoCodeSegment(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export function formatFullPromoCode(segment: string): string {
  return `DEMO-${segment}`;
}
