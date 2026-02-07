import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, email: admin.email });
}
