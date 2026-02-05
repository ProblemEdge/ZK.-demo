import webpush from 'web-push';
import { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// VAPID設定
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
if (!VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('[Notification] Missing VAPID keys. Push may fail.');
}

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
  actorId?: string,
  type: NotificationType = 'POST_APPROVED'
) {
  try {
    console.log('[Notification] Creating notification:', { userId, title, type });
    
    // 1. 通知センターに保存（アプリ内通知）
    const notification = await prisma.notification.create({
      data: {
        userId,
        actorId: actorId || null,
        type,
        title,
        body: body,
        link: url || null,
        isRead: false
      }
    });
    
    console.log('[Notification] Created notification:', notification.id);

    // 2. プッシュ通知を送信
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });
    
    console.log('[Notification] Found subscriptions:', subscriptions.length);

    if (subscriptions.length === 0) {
      console.log('[Notification] No push subscriptions found for user:', userId);
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload
          );
          console.log('[Notification] Push notification sent to:', sub.endpoint.substring(0, 50));
        } catch (error: any) {
          console.error('[Notification] Push notification error:', error.message);
          // 購読が無効な場合は削除
          if (error.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      })
    );
  } catch (error) {
    console.error('[Notification] Send notification error:', error);
    throw error; // エラーを再スローして呼び出し元で確認できるようにする
  }
}
