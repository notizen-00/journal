import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const themes = [
    { key: "default", name: "Default", description: "Baseline journal theme" },
    { key: "modern", name: "Modern", description: "Modern editorial layout" },
    { key: "journal", name: "Journal", description: "Classic academic journal layout" },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { key: theme.key },
      update: {},
      create: theme,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@unej.ac.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-in-production";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Publisher Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  console.log(`Seeded ${themes.length} themes and admin user ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
