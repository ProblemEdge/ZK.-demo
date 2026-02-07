'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationsHeader from '../components/NotificationsHeader';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationsAsRead } from '@/actions/notification';

interface NotificationActor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actor: NotificationActor | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.isRead).map((n) => n.id),
    [notifications]
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      void fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setNotifications(data as NotificationItem[]);

      const unread = (data as NotificationItem[]).filter((n) => !n.isRead).map((n) => n.id);
      if (unread.length > 0) {
        await markNotificationsAsRead(unread);
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (notification: NotificationItem) => {
    if (notification.link) {
      router.push(notification.link);
    }
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

        {!loading && error && (
          <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700 text-center">
            {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center text-[#bfbdbd] py-12">通知はまだありません</div>
        )}

        {!loading && !error && notifications.length > 0 && (
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

      {/* BottomNav moved to RootLayout */}
    </div>
  );
}
