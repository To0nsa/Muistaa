// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

/*   await prisma.oAuthScope.createMany({
    data: [
      { name: "tasks:read" },
      { name: "tasks:write" },
      { name: "projects:read" },
    ],
    skipDuplicates: true,
  });

  console.log('Seeded OAuth scopes'); */
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
