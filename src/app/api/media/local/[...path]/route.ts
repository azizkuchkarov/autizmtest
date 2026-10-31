import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

/**
 * Lokal test uchun: LOCAL_VIDEO_DIR papkasidagi videolarni Range so'rovlari bilan beradi.
 * Bunny Stream'ga ko'chirilgach, videoUrl lar to'g'ridan-to'g'ri CDN manziliga almashtiriladi.
 */
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const root = process.env.LOCAL_VIDEO_DIR;
  if (!root) return notFound();

  const { path: parts } = await params;
  const base = path.resolve(root);
  const file = path.resolve(base, ...parts.map((p) => decodeURIComponent(p)));
  if (!file.startsWith(base + path.sep)) return notFound();

  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) return notFound();

  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return notFound();

  const size = info.size;
  const headers = new Headers({ "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });

  const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (!match || (!match[1] && !match[2])) {
    headers.set("Content-Length", String(size));
    return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { status: 200, headers });
  }

  // "bytes=-500" — oxirgi 500 bayt
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, { status: 206, headers });
}
