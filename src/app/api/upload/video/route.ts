import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { mediaDir, requireAdmin } from "@/lib/content-admin";

/*
 * Admin panel: video faylni yuklash (so'rov tanasi — faylning o'zi, nomi "x-file-name" sarlavhasida).
 * Fayl MEDIA_DIR/incoming/ ga yoziladi; video saqlanganda scripts/video-worker.mjs uni siqadi.
 * /api/admin/* dan tashqarida: middleware katta so'rov tanasini cheklamasligi uchun (admin tekshiruvi shu yerda).
 */

const MAX_BYTES = 4 * 1024 ** 3;
const EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]);

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const name = decodeURIComponent(req.headers.get("x-file-name") ?? "");
  const ext = path.extname(name).toLowerCase();
  if (!EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Faqat video fayl: MP4, MOV, M4V, WEBM, MKV yoki AVI." }, { status: 400 });
  }
  if (!req.body) return NextResponse.json({ error: "Fayl yuborilmadi." }, { status: 400 });
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) return NextResponse.json({ error: "Fayl 4 GB dan katta." }, { status: 413 });

  const dir = path.join(mediaDir(), "incoming");
  await mkdir(dir, { recursive: true });
  const uploadId = `${randomUUID()}${ext}`;
  const file = path.join(dir, uploadId);

  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      done(size > MAX_BYTES ? new Error("too-large") : null, chunk);
    },
  });

  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), limit, createWriteStream(file));
  } catch (e) {
    await rm(file, { force: true });
    const tooLarge = e instanceof Error && e.message === "too-large";
    return NextResponse.json({ error: tooLarge ? "Fayl 4 GB dan katta." : "Yuklash uzildi. Qayta urinib ko'ring." }, { status: tooLarge ? 413 : 400 });
  }
  if (size === 0) {
    await rm(file, { force: true });
    return NextResponse.json({ error: "Fayl bo'sh." }, { status: 400 });
  }
  return NextResponse.json({ uploadId, size });
}
