/** To'lov summasi (so'm). .env da PAYMENT_AMOUNT=1000 (test) yoki 125000 (asl). */
export function getPaymentAmount(): number {
  const v = process.env.PAYMENT_AMOUNT;
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1_000;
}
