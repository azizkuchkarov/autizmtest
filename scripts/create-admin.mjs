// Admin yaratadi yoki mavjud adminning parolini almashtiradi (serverda, loyiha papkasida):
//   ADMIN_EMAIL=siz@example.com ADMIN_PASSWORD='uzun-tasodifiy-parol' node --env-file=.env scripts/create-admin.mjs
// Parol almashtirilganda shu adminning barcha sessiyalari o'chiriladi — eski cookie'lar bilan kirib bo'lmaydi.
// Parolni hech qachon kodga yoki git'ga yozmang: repozitoriy ochiq.

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";

if (!email || !email.includes("@")) {
  console.error("ADMIN_EMAIL muhit o'zgaruvchisini kiriting.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("ADMIN_PASSWORD kamida 12 belgidan iborat bo'lishi kerak.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  // Sayt (src/lib/admin-auth.ts) bilan bir xil bcrypt narxi
  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, password: hash },
    update: { password: hash },
  });
  const { count } = await prisma.adminSession.deleteMany({ where: { adminId: admin.id } });
  console.log(`Admin tayyor: ${email}. O'chirilgan sessiyalar: ${count}.`);
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
