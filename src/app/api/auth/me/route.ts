import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/user-auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: { id: user.id, phone: user.phone },
  });
}
