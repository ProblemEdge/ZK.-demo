import { z } from 'zod';

/**
 * 投稿のスキーマ定義
 */
export const postSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  imageUrl: z.string().url(),
  caption: z.string(),
  tags: z.string(),
  location: z.string().nullable().optional(),
  postedAt: z.string().datetime(),
  rejectedAt: z.string().datetime().nullable().optional(),
  isApproved: z.boolean(),
  visibilityScope: z.enum(['PUBLIC', 'FRIENDS']),
  visibilityDurationMinutes: z.number().int().nullable().optional(),
  likeCount: z.number().int().min(0).optional(),
  commentCount: z.number().int().min(0).optional(),
  questId: z.string().uuid().nullable().optional(),
  quest: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    date: z.string().datetime(),
  }).nullable().optional(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }).optional(),
});

export type Post = z.infer<typeof postSchema>;

/**
 * コメントのスキーマ定義
 */
export const commentSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }).optional(),
});

export type Comment = z.infer<typeof commentSchema>;

/**
 * 投稿作成用スキーマ
 */
export const createPostSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(1000),
  tags: z.string().max(200),
  location: z.string().max(200).optional(),
  visibilityScope: z.enum(['PUBLIC', 'FRIENDS']).default('PUBLIC'),
  visibilityDurationMinutes: z.number().int().positive().nullable().optional(),
  questId: z.string().uuid().nullable().optional(),
});

export type CreatePost = z.infer<typeof createPostSchema>;

/**
 * コメント作成用スキーマ
 */
export const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

export type CreateComment = z.infer<typeof createCommentSchema>;

/**
 * フィード応答スキーマ
 */
export const feedResponseSchema = z.object({
  voting: z.array(postSchema),
  approved: z.array(postSchema),
});

export type FeedResponse = z.infer<typeof feedResponseSchema>;
