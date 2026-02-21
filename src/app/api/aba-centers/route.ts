import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Ota-onalar uchun: viloyat tanlab, shu viloyatdagi ABA markazlarni olish. ?region=Toshkent */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region")?.trim();
  const where: { active: boolean; region?: string } = { active: true };
  if (region) where.region = region;

  const items = await prisma.abaCenter.findMany({
    where,
    orderBy: [{ region: "asc" }, { order: "asc" }],
    select: {
      id: true,
      region: true,
      name: true,
      phone: true,
      address: true,
      url: true,
      instagram: true,
      note: true,
      imageUrl: true,
    },
  });
  return NextResponse.json({ items });
}
