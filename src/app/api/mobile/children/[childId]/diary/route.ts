import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { diarySchema, ownChild, requireUser, toPublicDiary, validationError } from "@/lib/mobile-api";

type Ctx = { params: Promise<{ childId: string }> };

/** Kundalik yozuvlari: ?from=YYYY-MM-DD (ixtiyoriy) — shu sanadan boshlab, yangisi oxirida. */
export async function GET(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const from = new URL(req.url).searchParams.get("from");
  const entries = await prisma.diaryEntry.findMany({
    where: { childId, ...(from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? { date: { gte: from } } : {}) },
    orderBy: { date: "asc" },
    take: 400,
  });
  return NextResponse.json({ entries: entries.map(toPublicDiary) });
}

/** Bir kunlik yozuvni saqlash (o'sha kun uchun bor bo'lsa yangilanadi). */
export async function PUT(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const parsed = diarySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { date, ...data } = parsed.data;
  const entry = await prisma.diaryEntry.upsert({
    where: { childId_date: { childId, date } },
    create: { childId, date, ...data },
    update: data,
  });
  return NextResponse.json({ entry: toPublicDiary(entry) });
}
