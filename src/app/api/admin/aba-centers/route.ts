import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.abaCenter.findMany({
    orderBy: [{ region: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : [];

  const tx = items.map((c: { id?: string; region?: string; district?: string | null; name?: string; phone?: string | null; address?: string | null; url?: string | null; instagram?: string | null; note?: string | null; imageUrl?: string | null; order?: number; active?: boolean }, idx: number) =>
    prisma.abaCenter.upsert({
      where: { id: String(c.id ?? "") },
      create: {
        id: String(c.id ?? crypto.randomUUID()),
        region: String(c.region ?? ""),
        district: c.district ? String(c.district) : null,
        name: String(c.name ?? ""),
        phone: c.phone ? String(c.phone) : null,
        address: c.address ? String(c.address) : null,
        url: c.url ? String(c.url) : null,
        instagram: c.instagram ? String(c.instagram) : null,
        note: c.note ? String(c.note) : null,
        imageUrl: c.imageUrl ? String(c.imageUrl) : null,
        order: typeof c.order === "number" && Number.isFinite(c.order) ? c.order : idx,
        active: c.active !== false,
      },
      update: {
        region: String(c.region ?? ""),
        district: c.district ? String(c.district) : null,
        name: String(c.name ?? ""),
        phone: c.phone ? String(c.phone) : null,
        address: c.address ? String(c.address) : null,
        url: c.url ? String(c.url) : null,
        instagram: c.instagram ? String(c.instagram) : null,
        note: c.note ? String(c.note) : null,
        imageUrl: c.imageUrl ? String(c.imageUrl) : null,
        order: typeof c.order === "number" && Number.isFinite(c.order) ? c.order : idx,
        active: c.active !== false,
      },
    })
  );
  await prisma.$transaction(tx);
  return NextResponse.json({ ok: true });
}
