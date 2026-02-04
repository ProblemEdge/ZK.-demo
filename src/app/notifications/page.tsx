'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import NotificationsHeader from '../components/NotificationsHeader';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '@/domains/notifications/hooks';
import { markNotificationsAsRead } from '@/actions/notification';
import type { Notification } from '@/domains/notifications/schema';

export default function NotificationsPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { notifications, mutate, isLoading: loading, error: fetchError } = useNotifications();

  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.isRead).map((n) => n.id),
    [notifications]
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && unreadIds.length > 0) {
      void markNotificationsAsRead(unreadIds).then(() => {
        mutate();
      });
    }
  }, [status, unreadIds, router, mutate]);

  const handleOpen = (notification: Notification) => {
    // Notifications don't have a link property in our schema, but we can construct one based on type
    // For now, just keep it as placeholder
    router.push('/feed');
  };

  return (
    <div
      className="min-h-screen bg-[#0b0c0f]"
      style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}
    >
      <NotificationsHeader />

      <div className="px-4 pt-4">
        {loading && (
          <div className="text-center text-[#bfbdbd] py-8">読み込み中...</div>
        )}

        {!loading && fetchError && (
          <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700 text-center">
            ネットワークエラーが発生しました
          </div>
        )}

        {!loading && !fetchError && notifications.length === 0 && (
          <div className="text-center text-[#bfbdbd] py-12">通知はまだありません</div>
        )}

        {!loading && !fetchError && notifications.length > 0 && (
          <div className="flex flex-col gap-3 pb-4">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleOpen(notification)}
                className={`w-full text-left rounded-2xl border p-4 flex gap-3 transition ${
                  notification.isRead
                    ? 'bg-[#14161a] border-white/30'
                    : 'bg-[#111c16] border-[#00e676]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#1d1e21] border border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {notification.actor?.avatarUrl ? (
                    <img
                      src={notification.actor.avatarUrl}
                      alt={notification.actor.displayName || notification.actor.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {(notification.actor?.displayName || notification.actor?.username || 'Z')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white font-bold text-[15px]">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="text-[10px] text-white bg-[#00e676] px-2 py-0.5 rounded-full">
                        未読
                      </span>
                    )}
                  </div>
                  {notification.body && (
                    <p className="text-[#bfbdbd] text-[13px] mt-1">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-[#6b7280] text-[11px] mt-2">
                    {new Date(notification.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
