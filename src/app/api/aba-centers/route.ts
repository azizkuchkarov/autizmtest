import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Ota-onalar uchun: viloyat tanlab, shu viloyatdagi ABA markazlarni olish. ?region=Toshkent shahar&district=Chilonzor */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region")?.trim();
  const district = searchParams.get("district")?.trim();
  const where: { active: boolean; region?: string; district?: string | null } = { active: true };
  if (region) where.region = region;
  if (district) where.district = district;

  const items = await prisma.abaCenter.findMany({
    where,
    orderBy: [{ region: "asc" }, { order: "asc" }],
    select: {
      id: true,
      region: true,
      district: true,
      name: true,
      phone: true,
      address: true,
      url: true,
      instagram: true,
      note: true,
      imageUrl: true,
      directorName: true,
      directorImageUrl: true,
      directorBio: true,
      amenities: true,
      portfolioDescription: true,
    },
  });
  return NextResponse.json({ items });
}
