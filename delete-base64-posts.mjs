import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Base64画像を含む投稿を検索中...');

  // Base64形式のimageURLを持つ投稿を削除
  const result = await prisma.post.deleteMany({
    where: {
      imageUrl: {
        startsWith: 'data:image'
      }
    }
  });

  console.log(`✅ ${result.count}件のBase64投稿を削除しました`);
  console.log('💡 これから新規投稿はCloudinaryに保存されます');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
