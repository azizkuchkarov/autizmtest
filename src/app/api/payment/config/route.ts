import { NextResponse } from "next/server";
import { getLessonAccess } from "@/lib/lesson-access";

/**
 * Darslar bo'limiga kirish holati: to'lov UI shu mijozga (veb yoki mobil ilova versiyasi) ko'rinadimi,
 * foydalanuvchining oylik kirishi qachongacha va narx.
 */
export async function GET() {
  return NextResponse.json(await getLessonAccess(), { headers: { "Cache-Control": "no-store" } });
}
