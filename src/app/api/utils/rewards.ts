export const REWARD_CONFIG = {
  levelUpGems: 100,
  vote: {
    gems: 10,
    exp: 5
  },
  postApproved: {
    gems: 50,
    exp: 25
  },
  questBonus: {
    gems: 30,
    exp: 50
  }
} as const;

/**
 * レベルに必要な経験値を計算（指数関数的に増加）
 * レベル1: 50xp
 * レベル2: 100xp
 * レベル3: 200xp
 * レベル4: 400xp
 * 式: 50 * (2 ^ (level - 1))
 */
export function getExpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(50 * Math.pow(2, level - 1));
}
