import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aacCategorySchema, requireAdmin, validationError } from "@/lib/content-admin";

/** Barcha bo'limlar (yopiqlari ham) va kartalar. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const categories = await prisma.aacCategory.findMany({
    orderBy: { order: "asc" },
    include: { cards: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = aacCategorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const exists = await prisma.aacCategory.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "Bunday slug allaqachon bor." }, { status: 409 });

  const category = await prisma.aacCategory.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}
