// Admin yuklagan videolarni telefonga mos qiladi: 720p H.264 (faststart), muqova rasmi va davomiylik.
// Navbat — bazadagi Video.sourceFile; bittadan ishlaydi, server qayta yuklansa chala ish davom etadi.
// Ishga tushirish (serverda pm2 bilan):
//   pm2 start "node --env-file=.env scripts/video-worker.mjs" --name autizmtest-video
// Talab: ffmpeg/ffprobe, .env da DATABASE_URL va LOCAL_VIDEO_DIR.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const POLL_MS = 15_000;
const MEDIA = process.env.LOCAL_VIDEO_DIR;
if (!MEDIA) {
  console.error("LOCAL_VIDEO_DIR .env da belgilanmagan.");
  process.exit(1);
}

const prisma = new PrismaClient();
const OWN_PREFIX = "/api/media/local/";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    // Pastroq ustuvorlik: sayt so'rovlari sekinlashmasin
    const child = spawn("nice", ["-n", "10", cmd, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err = (err + d).slice(-2000)));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd}: ${err.trim().split("\n").pop()}`))));
  });
}

async function duration(file) {
  const out = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  const sec = Number.parseFloat(out);
  return Number.isFinite(sec) && sec > 0 ? sec : null;
}

/** Faqat server o'zi yaratgan fayllarni o'chiradi (videos/, thumbs/). */
async function removeOwn(url) {
  if (!url?.startsWith(OWN_PREFIX)) return;
  const rel = decodeURIComponent(url.slice(OWN_PREFIX.length));
  if (!/^(videos|thumbs)\//.test(rel)) return;
  await rm(path.join(MEDIA, rel), { force: true });
}

async function processVideo(video) {
  const src = video.sourceFile;
  const stamp = Date.now();
  const videoRel = `videos/${video.id}-${stamp}.mp4`;
  const thumbRel = `thumbs/${video.id}-${stamp}.jpg`;
  const out = path.join(MEDIA, videoRel);
  const thumb = path.join(MEDIA, thumbRel);
  await mkdir(path.dirname(out), { recursive: true });
  await mkdir(path.dirname(thumb), { recursive: true });

  if (!existsSync(src)) throw new Error("Yuklangan fayl topilmadi");
  console.log(`[video] ${video.id}: siqilmoqda…`);
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", src,
    "-vf", "scale=-2:'min(720,ih)'",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-maxrate", "2500k", "-bufsize", "5000k", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    out,
  ]);
  const sec = await duration(out);
  // Muqova: boshidan 10% (qora birinchi kadrni chetlab o'tish uchun)
  await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(Math.max(1, (sec ?? 10) * 0.1)), "-i", out, "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "3", thumb]);

  // Admin muqovani qo'lda (tashqi havola bilan) qo'ygan bo'lsa — o'zgartirilmaydi
  const keepThumb = video.thumbnailUrl && !video.thumbnailUrl.startsWith(OWN_PREFIX);
  await prisma.video.update({
    where: { id: video.id },
    data: {
      videoUrl: OWN_PREFIX + videoRel,
      thumbnailUrl: keepThumb ? video.thumbnailUrl : OWN_PREFIX + thumbRel,
      durationSec: sec ? Math.round(sec) : video.durationSec,
      status: "ready",
      sourceFile: null,
      processError: null,
    },
  });
  if (keepThumb) await rm(thumb, { force: true });
  // Eski versiya (video almashtirilgan bo'lsa) va yuklangan asl fayl o'chiriladi
  await Promise.all([removeOwn(video.videoUrl), keepThumb ? null : removeOwn(video.thumbnailUrl), rm(src, { force: true })]);
  console.log(`[video] ${video.id}: tayyor (${sec ? Math.round(sec) : "?"} s)`);
}

/** Muqovasiz eski videolar (qo'lda yuklangan) uchun muqova yaratiladi; xato bo'lganlar qayta urinilmaydi. */
const thumbFailed = new Set();
async function backfillThumbnail() {
  const video = await prisma.video.findFirst({
    where: { thumbnailUrl: null, status: "ready", sourceFile: null, videoUrl: { startsWith: OWN_PREFIX }, id: { notIn: [...thumbFailed] } },
  });
  if (!video) return false;
  const file = path.join(MEDIA, decodeURIComponent(video.videoUrl.slice(OWN_PREFIX.length)));
  const thumbRel = `thumbs/${video.id}-${Date.now()}.jpg`;
  try {
    await mkdir(path.join(MEDIA, "thumbs"), { recursive: true });
    const sec = await duration(file);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(Math.max(1, (sec ?? 10) * 0.1)), "-i", file, "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "3", path.join(MEDIA, thumbRel)]);
    await prisma.video.update({
      where: { id: video.id },
      data: { thumbnailUrl: OWN_PREFIX + thumbRel, durationSec: video.durationSec ?? (sec ? Math.round(sec) : null) },
    });
    console.log(`[video] ${video.id}: muqova yaratildi`);
  } catch (e) {
    thumbFailed.add(video.id);
    console.error(`[video] ${video.id}: muqova yaratilmadi — ${e instanceof Error ? e.message : e}`);
  }
  return true;
}

async function tick() {
  const video = await prisma.video.findFirst({ where: { sourceFile: { not: null } }, orderBy: { updatedAt: "asc" } });
  if (!video) return backfillThumbnail();
  try {
    await processVideo(video);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[video] ${video.id}: xato — ${message}`);
    await prisma.video.update({
      where: { id: video.id },
      // Yangi video bo'lsa "xato"; almashtirish bo'lsa eski versiya ko'rinishda qoladi
      data: { sourceFile: null, processError: message.slice(0, 500), ...(video.videoUrl ? {} : { status: "failed" }) },
    });
    await rm(video.sourceFile, { force: true });
  }
  return true;
}

console.log(`[video] worker ishga tushdi, papka: ${MEDIA}`);
for (;;) {
  const worked = await tick().catch((e) => {
    console.error("[video] navbatni o'qib bo'lmadi:", e instanceof Error ? e.message : e);
    return false;
  });
  if (!worked) await new Promise((r) => setTimeout(r, POLL_MS));
}
