import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, soundSetSchema, validationError } from "@/lib/content-admin";

/** Barcha ovoz to'plamlari (yopiqlari ham) va ularning ovozlari. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sets = await prisma.soundSet.findMany({
    orderBy: { order: "asc" },
    include: { cards: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ sets });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = soundSetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const exists = await prisma.soundSet.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "Bunday slug allaqachon bor." }, { status: 409 });

  const set = await prisma.soundSet.create({ data: parsed.data });
  return NextResponse.json({ set }, { status: 201 });
}
