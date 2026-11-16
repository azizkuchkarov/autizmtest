import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/content-admin";

const UPLOAD_DIR = "public/uploads/aba";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Rasm turi faylning boshidagi baytlar bo'yicha aniqlanadi — mijoz yuborgan nom va MIME turiga ishonilmaydi.
 * Fayllar nginx orqali to'g'ridan-to'g'ri beriladi: kengaytma .html yoki .svg bo'lsa, saytda begona skript ishlab ketardi.
 */
function detectImageExt(b: Buffer): ".jpg" | ".png" | ".gif" | ".webp" | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg";
  if (b.length >= 8 && b.subarray(0, 8).equals(PNG_SIGNATURE)) return ".png";
  if (b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("latin1"))) return ".gif";
  if (b.length >= 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return ".webp";
  return null;
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Rasm fayli kerak." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fayl 5 MB dan katta bo‘lmasin." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(bytes);
    if (!ext) {
      return NextResponse.json({ error: "Faqat rasm: JPEG, PNG, WebP, GIF." }, { status: 400 });
    }

    const name = `${crypto.randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);

    return NextResponse.json({ url: `/uploads/aba/${name}` });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    console.error("ABA upload error:", err?.code ?? err?.message ?? e);
    // VDS da permission/papka xatolarini tushunarli qilish (faqat adminga ko'rinadi)
    if (err?.code === "EACCES") {
      return NextResponse.json(
        { error: "Rasm papkasiga yozish ruxsati yo'q. Serverda public/uploads/aba papkasiga chmod/chown bering." },
        { status: 500 }
      );
    }
    if (err?.code === "ENOENT") {
      return NextResponse.json(
        { error: "Upload papkasi topilmadi. public/uploads/aba yarating va ruxsat bering." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Yuklash xatosi." }, { status: 500 });
  }
}
