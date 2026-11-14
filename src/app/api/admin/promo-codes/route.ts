import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/admin-auth";
import { formatFullPromoCode, generatePromoCodeSegment } from "@/lib/promo-code";

export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      assessment: { select: { id: true, ageGroup: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      code: p.code,
      assessmentId: p.assessmentId,
      expiresAt: p.expiresAt?.toISOString() ?? null,
      maxUses: p.maxUses,
      usedCount: p.usedCount,
      active: p.active,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
      assessmentAgeGroup: p.assessment.ageGroup,
      assessmentCreatedAt: p.assessment.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : null;
    const maxUses = typeof body?.maxUses === "number" && body.maxUses >= 1 && body.maxUses <= 100 ? body.maxUses : 1;
    let expiresAt: Date | null = null;
    if (typeof body?.expiresAt === "string" && body.expiresAt) {
      const d = new Date(body.expiresAt);
      if (!Number.isNaN(d.getTime())) expiresAt = d;
    }

    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId majburiy." }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment topilmadi." }, { status: 404 });
    }

    let code = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = formatFullPromoCode(generatePromoCodeSegment());
      const exists = await prisma.promoCode.findUnique({ where: { code: candidate } });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return NextResponse.json({ error: "Kod yaratilmadi, qayta urinib ko‘ring." }, { status: 500 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code,
        assessmentId,
        maxUses,
        expiresAt,
        note: note || null,
        active: true,
      },
    });

    return NextResponse.json({
      ok: true,
      promo: {
        id: promo.id,
        code: promo.code,
        assessmentId: promo.assessmentId,
        maxUses: promo.maxUses,
        expiresAt: promo.expiresAt?.toISOString() ?? null,
        note: promo.note,
        createdAt: promo.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
