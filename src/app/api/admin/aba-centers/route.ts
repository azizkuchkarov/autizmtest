import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.abaCenter.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : [];

  const tx = items.map((c: any, idx: number) =>
    prisma.abaCenter.upsert({
      where: { id: String(c.id ?? "") },
      create: {
        id: String(c.id ?? crypto.randomUUID()),
        region: String(c.region ?? ""),
        name: String(c.name ?? ""),
        phone: c.phone ? String(c.phone) : null,
        address: c.address ? String(c.address) : null,
        note: c.note ? String(c.note) : null,
        order: Number.isFinite(c.order) ? c.order : idx,
        active: c.active !== false,
      },
      update: {
        region: String(c.region ?? ""),
        name: String(c.name ?? ""),
        phone: c.phone ? String(c.phone) : null,
        address: c.address ? String(c.address) : null,
        note: c.note ? String(c.note) : null,
        order: Number.isFinite(c.order) ? c.order : idx,
        active: c.active !== false,
      },
    })
  );
  await prisma.$transaction(tx);
  return NextResponse.json({ ok: true });
}
