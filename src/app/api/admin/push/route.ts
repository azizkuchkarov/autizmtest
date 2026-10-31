import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, validationError } from "@/lib/content-admin";
import { PUSH_TARGETS, pushAudienceStats, sendPushToAll } from "@/lib/push";

/** Nechta qurilmaga yuborish mumkinligi (til va platforma bo'yicha). */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await pushAudienceStats());
}

const sendSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(240),
  audience: z.enum(["all", "uz", "ru"]),
  url: z.enum(PUSH_TARGETS),
});

/** Admin xabari: barcha mobil foydalanuvchilarga yoki bitta til bo'yicha. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { audience, ...message } = parsed.data;
  try {
    return NextResponse.json(await sendPushToAll(message, audience));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Yuborib bo'lmadi." }, { status: 502 });
  }
}
