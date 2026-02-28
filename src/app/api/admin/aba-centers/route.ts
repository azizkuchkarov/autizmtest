import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.abaCenter.findMany({
      orderBy: [{ region: "asc" }, { order: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[ABA centers GET]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Ro'yxat yuklanmadi.", details: msg },
      { status: 500 }
    );
  }
}

type AbaCenterPayload = {
  id?: string;
  region?: string;
  district?: string | null;
  name?: string;
  phone?: string | null;
  address?: string | null;
  url?: string | null;
  instagram?: string | null;
  note?: string | null;
  imageUrl?: string | null;
  directorName?: string | null;
  directorImageUrl?: string | null;
  directorBio?: string | null;
  amenities?: { title: string; imageUrl: string }[] | null;
  portfolioDescription?: string | null;
  order?: number;
  active?: boolean;
};

function toPrismaCenter(c: AbaCenterPayload, idx: number) {
  const id = String(c.id ?? crypto.randomUUID());
  const amenitiesValue = Array.isArray(c.amenities) ? (c.amenities as Prisma.InputJsonValue) : Prisma.JsonNull;
  const base = {
    region: String(c.region ?? ""),
    district: c.district ? String(c.district) : null,
    name: String(c.name ?? ""),
    phone: c.phone ? String(c.phone) : null,
    address: c.address ? String(c.address) : null,
    url: c.url ? String(c.url) : null,
    instagram: c.instagram ? String(c.instagram) : null,
    note: c.note ? String(c.note) : null,
    imageUrl: c.imageUrl ? String(c.imageUrl) : null,
    directorName: c.directorName ? String(c.directorName) : null,
    directorImageUrl: c.directorImageUrl ? String(c.directorImageUrl) : null,
    directorBio: c.directorBio ? String(c.directorBio) : null,
    amenities: amenitiesValue,
    portfolioDescription: c.portfolioDescription ? String(c.portfolioDescription) : null,
    order: typeof c.order === "number" && Number.isFinite(c.order) ? c.order : idx,
    active: c.active !== false,
  };
  return { id, ...base };
}

export async function PUT(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : [];

  const tx = items.map((c: AbaCenterPayload, idx: number) => {
    const data = toPrismaCenter(c, idx);
    return prisma.abaCenter.upsert({
      where: { id: data.id },
      create: data,
      update: {
        region: data.region,
        district: data.district,
        name: data.name,
        phone: data.phone,
        address: data.address,
        url: data.url,
        instagram: data.instagram,
        note: data.note,
        imageUrl: data.imageUrl,
        directorName: data.directorName,
        directorImageUrl: data.directorImageUrl,
        directorBio: data.directorBio,
        amenities: data.amenities as Prisma.InputJsonValue,
        portfolioDescription: data.portfolioDescription,
        order: data.order,
        active: data.active,
      },
    });
  });
  await prisma.$transaction(tx);
  return NextResponse.json({ ok: true });
}
