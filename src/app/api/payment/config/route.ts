import { NextResponse } from "next/server";
import { getPaymentAmount, paymentsVisible } from "@/lib/payment-config";

/** To'lov UI shu mijozga (veb yoki mobil ilova versiyasi) ko'rinadimi va narx. */
export async function GET() {
  const visible = await paymentsVisible();
  return NextResponse.json(
    { visible, amount: visible ? getPaymentAmount() : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
