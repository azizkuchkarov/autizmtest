import { NextResponse } from "next/server";
import { deleteBearerSession } from "@/lib/user-auth";

export async function POST() {
  await deleteBearerSession();
  return NextResponse.json({ ok: true });
}
