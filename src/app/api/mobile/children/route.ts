import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { childSchema, requireUser, toPublicChild, validationError } from "@/lib/mobile-api";

const MAX_CHILDREN = 10;

export async function POST(req: Request) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const parsed = childSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const count = await prisma.child.count({ where: { userId: user.id } });
  if (count >= MAX_CHILDREN) {
    return NextResponse.json({ error: "Bolalar soni chegarasiga yetildi." }, { status: 400 });
  }

  const child = await prisma.child.create({ data: { ...parsed.data, userId: user.id } });
  return NextResponse.json({ child: toPublicChild(child) }, { status: 201 });
}
