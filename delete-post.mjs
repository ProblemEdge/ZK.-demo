import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findFirst({
    where: {
      caption: {
        contains: '最高の景色'
      }
    }
  });
  
  if (post) {
    console.log('Found post:', post.id, post.caption);
    await prisma.vote.deleteMany({ where: { postId: post.id } });
    await prisma.post.delete({ where: { id: post.id } });
    console.log('Post deleted successfully');
  } else {
    console.log('Post not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
