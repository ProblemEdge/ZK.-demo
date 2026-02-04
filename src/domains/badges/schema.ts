import { z } from 'zod';

/**
 * バッジのスキーマ定義
 */
export const badgeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().nullable(),
  imageUrl: z.string().url(),
  _count: z.object({
    users: z.number().int().min(0),
  }).optional(),
});

export type Badge = z.infer<typeof badgeSchema>;

/**
 * バッジ作成用スキーマ
 */
export const createBadgeSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
});

export type CreateBadge = z.infer<typeof createBadgeSchema>;

/**
 * バッジ付与/はく奪用スキーマ
 */
export const manageBadgeSchema = z.object({
  userId: z.string().uuid(),
  badgeName: z.string().min(1),
});

export type ManageBadge = z.infer<typeof manageBadgeSchema>;

/**
 * ユーザーバッジ情報のスキーマ
 */
export const userBadgeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().url(),
  awardedAt: z.string().datetime().optional(),
});

export type UserBadge = z.infer<typeof userBadgeSchema>;
