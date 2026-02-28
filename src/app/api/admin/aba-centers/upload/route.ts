import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "public/uploads/aba";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "Rasm fayli kerak." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fayl 5 MB dan katta bo‘lmasin." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Faqat rasm: JPEG, PNG, WebP, GIF." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".jpg";
    const name = `${crypto.randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/uploads/aba/${name}`;
    return NextResponse.json({ url: publicUrl });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    console.error("ABA upload error:", err?.code ?? err?.message ?? e);
    // VDS da permission/papka xatolarini tushunarli qilish
    if (err?.code === "EACCES") {
      return NextResponse.json(
        { error: "Rasm papkasiga yozish ruxsati yo'q. Serverda public/uploads/aba papkasiga chmod/chown bering." },
        { status: 500 }
      );
    }
    if (err?.code === "ENOENT" || err?.message?.includes("ENOENT")) {
      return NextResponse.json(
        { error: "Upload papkasi topilmadi. public/uploads/aba yarating va ruxsat bering." },
        { status: 500 }
      );
    }
    const msg = err?.message ?? String(e);
    return NextResponse.json(
      { error: msg.length > 120 ? "Yuklash xatosi." : msg },
      { status: 500 }
    );
  }
}
