import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating database...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE User ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE User ADD COLUMN gems INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE User ADD COLUMN experience INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('Migration completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
