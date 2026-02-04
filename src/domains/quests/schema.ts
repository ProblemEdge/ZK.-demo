import { z } from 'zod';

/**
 * クエストのスキーマ定義
 */
export const questSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  date: z.string().datetime(),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  rewardGems: z.number().int().min(0).optional(),
  rewardExperience: z.number().int().min(0).optional(),
});

export type Quest = z.infer<typeof questSchema>;

/**
 * 今日のクエスト応答スキーマ
 */
export const todayQuestsSchema = z.object({
  quests: z.array(questSchema),
});

export type TodayQuests = z.infer<typeof todayQuestsSchema>;

/**
 * クエスト完了用スキーマ
 */
export const completeQuestSchema = z.object({
  questId: z.string().uuid(),
});

export type CompleteQuest = z.infer<typeof completeQuestSchema>;
