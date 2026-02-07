const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  const email = "aziz.kuchkarov91@gmail.com";
  const password = "Kuchkarov77@";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists");
    await prisma.$disconnect();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.admin.create({ data: { email, password: hash } });
  console.log("Admin created");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
