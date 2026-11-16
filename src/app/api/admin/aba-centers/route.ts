import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, validationError } from "@/lib/content-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const items = await prisma.abaCenter.findMany({
      orderBy: [{ region: "asc" }, { order: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[ABA centers GET]", e);
    return NextResponse.json({ error: "Ro'yxat yuklanmadi." }, { status: 500 });
  }
}

/** Bo'sh satr → null (eski xatti-harakat bilan bir xil) */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

const centerSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  region: z.string().trim().max(100).default(""),
  district: text(100),
  name: z.string().trim().max(200).default(""),
  phone: text(100),
  address: text(500),
  url: text(1000),
  instagram: text(1000),
  note: text(2000),
  imageUrl: text(1000),
  directorName: text(200),
  directorImageUrl: text(1000),
  directorBio: text(5000),
  amenities: z
    .array(z.object({ title: z.string().trim().max(200), imageUrl: z.string().trim().max(1000) }))
    .max(50)
    .nullish(),
  portfolioDescription: text(10000),
  telegramId: text(100),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

const putSchema = z.object({
  items: z.array(centerSchema).max(1000),
  /** Admin ro'yxatdan o'chirgan markazlar. Faqat shular o'chiriladi — ro'yxatda yo'qligi o'chirish degani emas. */
  deletedIds: z.array(z.string().trim().min(1).max(100)).max(1000).optional(),
});

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { items, deletedIds = [] } = parsed.data;

  const upserts = items.map((c, idx) => {
    const id = c.id ?? crypto.randomUUID();
    const data = {
      region: c.region,
      district: c.district,
      name: c.name,
      phone: c.phone,
      address: c.address,
      url: c.url,
      instagram: c.instagram,
      note: c.note,
      imageUrl: c.imageUrl,
      directorName: c.directorName,
      directorImageUrl: c.directorImageUrl,
      directorBio: c.directorBio,
      amenities: c.amenities ? (c.amenities as Prisma.InputJsonValue) : Prisma.JsonNull,
      portfolioDescription: c.portfolioDescription,
      telegramId: c.telegramId,
      order: c.order ?? idx,
      active: c.active !== false,
    };
    return prisma.abaCenter.upsert({ where: { id }, create: { id, ...data }, update: data });
  });

  try {
    // Hammasi bitta tranzaksiyada: xato bo'lsa hech narsa yarim saqlanmaydi.
    // Avval ro'yxatda yo'q markazlar avtomatik o'chirilardi — sahifa ro'yxatni yuklay olmasa, Saqlash hamma markazni o'chirib yuborardi.
    await prisma.$transaction([
      ...upserts,
      ...(deletedIds.length ? [prisma.abaCenter.deleteMany({ where: { id: { in: deletedIds } } })] : []),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ABA centers PUT]", e);
    return NextResponse.json({ error: "Saqlash amalga oshmadi." }, { status: 500 });
  }
}
