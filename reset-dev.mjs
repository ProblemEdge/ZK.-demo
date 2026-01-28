import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDailyData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 関連データを削除（外部キー制約対応）
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        post: { postedAt: { gte: today } }
      }
    });
    console.log(`✓ コメント: ${deletedComments.count}件削除`);

    const deletedLikes = await prisma.like.deleteMany({
      where: {
        post: { postedAt: { gte: today } }
      }
    });
    console.log(`✓ いいね: ${deletedLikes.count}件削除`);

    const deletedVotes = await prisma.vote.deleteMany({
      where: {
        post: { postedAt: { gte: today } }
      }
    });
    console.log(`✓ 投票: ${deletedVotes.count}件削除`);

    // クエスト進捗をすべて削除
    const deletedProgress = await prisma.userQuestProgress.deleteMany({});
    console.log(`✓ クエスト進捗: ${deletedProgress.count}件削除`);

    // 今日のクエストを削除
    const deletedQuests = await prisma.dailyQuest.deleteMany({
      where: { date: today }
    });
    console.log(`✓ クエスト: ${deletedQuests.count}件削除`);

    // 今日の投稿を削除
    const deletedPosts = await prisma.post.deleteMany({
      where: { postedAt: { gte: today } }
    });
    console.log(`✓ 投稿: ${deletedPosts.count}件削除`);

    console.log('\n✅ リセット完了');
  } catch (error) {
    console.error('❌ リセット失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDailyData();
