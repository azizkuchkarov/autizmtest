import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { categorySchema, requireAdmin, validationError } from "@/lib/content-admin";

/** Barcha yo'nalishlar, mavzular (yopiqlari ham) va ularning videolari. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [professions, categories] = await Promise.all([
    prisma.profession.findMany({ orderBy: { order: "asc" } }),
    prisma.contentCategory.findMany({
      orderBy: [{ kind: "asc" }, { order: "asc" }],
      include: { videos: { orderBy: { order: "asc" } } },
    }),
  ]);
  return NextResponse.json({ professions, categories });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const profession = await prisma.profession.findUnique({ where: { id: parsed.data.professionId } });
  if (!profession) return NextResponse.json({ error: "Yo'nalish topilmadi." }, { status: 404 });

  const exists = await prisma.contentCategory.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "Bunday slug allaqachon bor." }, { status: 409 });

  const category = await prisma.contentCategory.create({ data: parsed.data });
  return NextResponse.json({ category }, { status: 201 });
}
