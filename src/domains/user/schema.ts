import { z } from 'zod';

/**
 * ユーザーのスキーマ定義
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(50),
  displayName: z.string().max(100).nullable(),
  bio: z.string().max(500).nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  postCount: z.number().int().min(0),
  friendCount: z.number().int().min(0),
  level: z.number().int().min(1),
  gems: z.number().int().min(0),
  experience: z.number().int().min(0),
  completedQuestsCount: z.number().int().min(0),
});

export type User = z.infer<typeof userSchema>;

/**
 * ユーザー検索結果のスキーマ
 */
export const searchUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
});

export type SearchUser = z.infer<typeof searchUserSchema>;

/**
 * ユーザープロフィール更新用スキーマ
 */
export const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

/**
 * フォロワー情報のスキーマ
 */
export const followerSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  followedAt: z.string().datetime().optional(),
});

export type Follower = z.infer<typeof followerSchema>;
