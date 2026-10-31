import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { mediaDir } from "@/lib/content-admin";

/** /api/upload/video bergan ID → yuklangan fayl yo'li (topilmasa null). */
export function incomingFile(uploadId: string) {
  const file = path.join(mediaDir(), "incoming", path.basename(uploadId));
  return existsSync(file) ? file : null;
}

/** Server o'zi yaratgan media faylni o'chiradi (videos/, thumbs/, incoming/); tashqi havolalarga tegmaydi. */
export async function removeOwnMedia(urlOrPath: string | null | undefined) {
  if (!urlOrPath) return;
  const rel = urlOrPath.startsWith("/api/media/local/") ? decodeURIComponent(urlOrPath.slice("/api/media/local/".length)) : null;
  const file = rel ? path.join(mediaDir(), rel) : urlOrPath;
  const root = path.resolve(mediaDir());
  const resolved = path.resolve(file);
  const own = ["videos", "thumbs", "incoming"].some((d) => resolved.startsWith(path.join(root, d) + path.sep));
  if (own) await rm(resolved, { force: true });
}
