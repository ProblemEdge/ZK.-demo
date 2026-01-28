import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('すべての投稿を削除します...');
  
  // まず関連データを削除
  await prisma.vote.deleteMany({});
  console.log('投票データを削除しました');
  
  await prisma.like.deleteMany({});
  console.log('いいねデータを削除しました');
  
  await prisma.comment.deleteMany({});
  console.log('コメントデータを削除しました');
  
  // 最後に投稿を削除
  const result = await prisma.post.deleteMany({});
  console.log(`${result.count}件の投稿を削除しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
