import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const badges = await prisma.badge.count();
  const userBadges = await prisma.userBadge.count();
  const posts = await prisma.post.count();
  const notifications = await prisma.notification.count();
  console.log(`users: ${users}`);
  console.log(`badges: ${badges}`);
  console.log(`userBadges: ${userBadges}`);
  console.log(`posts: ${posts}`);
  console.log(`notifications: ${notifications}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
