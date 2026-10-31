import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { professionSchema, requireAdmin, validationError } from "@/lib/content-admin";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = professionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const exists = await prisma.profession.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "Bunday slug allaqachon bor." }, { status: 409 });

  const profession = await prisma.profession.create({ data: parsed.data });
  return NextResponse.json({ profession }, { status: 201 });
}
