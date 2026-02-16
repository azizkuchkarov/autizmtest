import { NextResponse } from "next/server";
import { getPaymentAmount } from "@/lib/payment-config";

export async function GET() {
  return NextResponse.json({ amount: getPaymentAmount() });
}
