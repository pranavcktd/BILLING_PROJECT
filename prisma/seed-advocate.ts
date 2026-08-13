import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.env.SEED_ADVOCATE_EMAIL;
  const password = process.env.SEED_ADVOCATE_PASSWORD;
  const name = process.env.SEED_ADVOCATE_NAME ?? "Advocate";

  if (!email || !password) {
    throw new Error(
      "Set SEED_ADVOCATE_EMAIL and SEED_ADVOCATE_PASSWORD before running this script."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, name, role: "ADVOCATE" },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "ADVOCATE",
    },
  });

  console.log(`Advocate account ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
