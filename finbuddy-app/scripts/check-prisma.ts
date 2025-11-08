import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log("DB connect ✓");
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error("DB connect failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
