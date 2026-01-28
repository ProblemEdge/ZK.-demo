import { PrismaClient } from '@prisma/client';
import { REWARD_CONFIG, getExpForLevel } from './rewards';

const prisma = new PrismaClient();

/**
 * ユーザーのレベルをチェックして更新
 * 経験値がしきい値に達したらレベルアップする
 */
export async function checkAndUpdateLevel(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // 次のレベルに必要な経験値（指数関数的に増加）
    const nextLevelExp = getExpForLevel(user.level);

    if (user.experience >= nextLevelExp) {
      // レベルアップ
      const newLevel = user.level + 1;
      const remainingExp = user.experience - nextLevelExp;

      await prisma.user.update({
        where: { id: userId },
        data: {
          level: newLevel,
          experience: remainingExp,
          gems: { increment: REWARD_CONFIG.levelUpGems } // レベルアップボーナス
        }
      });

      // 再帰的にレベルアップをチェック
      return await checkAndUpdateLevel(userId);
    }
  } catch (error) {
    console.error('Level update error:', error);
  }
}
