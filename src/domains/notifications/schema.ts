import { z } from 'zod';

/**
 * 通知のスキーマ定義
 */
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['LIKE', 'COMMENT', 'FOLLOW', 'FRIEND_REQUEST', 'BADGE_AWARDED', 'QUEST_COMPLETED', 'POST_APPROVED', 'POST_REJECTED']),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
  relatedUserId: z.string().uuid().nullable().optional(),
  relatedPostId: z.string().uuid().nullable().optional(),
  relatedUser: z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }).nullable().optional(),
});

export type Notification = z.infer<typeof notificationSchema>;

/**
 * 通知購読用スキーマ
 */
export const notificationSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type NotificationSubscription = z.infer<typeof notificationSubscriptionSchema>;
