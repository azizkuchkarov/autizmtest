import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aacCardSchema, requireAdmin, validationError } from "@/lib/content-admin";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = aacCardSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const category = await prisma.aacCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return NextResponse.json({ error: "Bo'lim topilmadi." }, { status: 404 });

  const card = await prisma.aacCard.create({ data: parsed.data });
  return NextResponse.json({ card }, { status: 201 });
}
