'use client';

import useSWR from 'swr';
import { notificationSchema } from './schema';
import type { Notification } from './schema';

const fetcher = (url: string) => fetch(url, { cache: 'no-store', credentials: 'include' }).then(res => res.json());

/**
 * 通知一覧を取得
 */
export function useNotifications() {
  const { data, error, mutate, isLoading } = useSWR('/api/notifications', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000, // 30秒ごとに自動更新
  });

  let notifications: Notification[] = [];
  if (data?.notifications) {
    notifications = data.notifications
      .map((n: unknown) => notificationSchema.safeParse(n))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Notification }) => r.data);
  }

  return {
    notifications,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 未読通知数を取得
 */
export function useUnreadNotificationCount() {
  const { data, error, mutate, isLoading } = useSWR('/api/notifications/unread-count', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000, // 30秒ごとに自動更新
  });

  const count = typeof data?.count === 'number' ? data.count : 0;

  return {
    count,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('通知の既読処理に失敗しました');
  }

  return res.json();
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead() {
  const res = await fetch('/api/notifications/read-all', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('通知の一括既読処理に失敗しました');
  }

  return res.json();
}

/**
 * プッシュ通知を購読
 */
export async function subscribePushNotification(subscription: PushSubscriptionJSON) {
  const res = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('プッシュ通知の購読に失敗しました');
  }

  return res.json();
}
