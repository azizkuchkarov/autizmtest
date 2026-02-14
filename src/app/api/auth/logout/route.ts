import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "@/lib/user-auth";

export async function POST() {
  await clearUserSessionCookie();
  return NextResponse.json({ ok: true });
}
