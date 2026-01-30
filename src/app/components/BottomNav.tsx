'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();

  const leftItems = [
    { href: '/feed', label: 'ホーム', icon: '🏠' },
    { href: '/vote', label: '投票', icon: '✅' }
  ];

  const rightItems = [
    { href: '/discover', label: 'ユーザー', icon: '🔍' },
    { href: '/profile', label: '', icon: '👤' }
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const fetchCount = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const res = await fetch('/api/notifications/unread-count');
        if (!res.ok) return;
        const data = await res.json();
        setNotificationCount(data.count || 0);
      } catch {
        // noop
      }
    };

    fetchCount();
    timer = setInterval(fetchCount, 300000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 shadow-lg" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex justify-around items-center h-12 relative" style={{ paddingBottom: 'calc(0.25rem + var(--safe-area-bottom))' }}>
        {/* 左側のアイテム */}
        {leftItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full transition"
          >
            {item.href === '/vote' ? (
              <img
                src="/icon_vote.png"
                alt="投票"
                className="w-10 h-10 object-contain transition"
                style={pathname === item.href ? { filter: 'brightness(2) saturate(1.8) hue-rotate(15deg)', transform: 'scale(1.15)' } : {}}
              />
            ) : item.href === '/feed' ? (
              <img
                src="/icon_home.png"
                alt="ホーム"
                className="w-10 h-10 object-contain transition"
                style={pathname === item.href ? { filter: 'brightness(2) saturate(1.8) hue-rotate(15deg)', transform: 'scale(1.15)' } : {}}
              />
            ) : item.href === '/discover' ? (
              <img
                src="/icon_people.png"
                alt="ユーザー"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <span className="text-3xl">{item.icon}</span>
            )}
          </Link>
        ))}

        {/* 中央の投稿ボタン */}
        <Link
          href="/post"
          className="flex items-center justify-center flex-1 h-full transition"
        >
          <img
            src="/icon_post.png"
            alt="投稿"
            className="object-contain transition"
            style={pathname === '/post' ? { width: '64px', height: '64px', filter: 'brightness(2) saturate(1.8) hue-rotate(15deg)', transform: 'scale(1.15)' } : { width: '56px', height: '56px' }}
          />
        </Link>

        {/* 右側のアイテム */}
        {rightItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full transition"
          >
            <span className="text-3xl relative">
              {item.href === '/vote' ? (
                <img
                  src="/icon_vote.png"
                  alt="投票"
                  className="w-8 h-8 object-contain transition"
                  style={pathname === item.href ? { filter: 'brightness(2) saturate(1.8) hue-rotate(15deg)', transform: 'scale(1.15)' } : {}}
                />
              ) : item.href === '/discover' ? (
                <img
                  src="/icon_people.png"
                  alt="ユーザー"
                  className="w-10 h-10 object-contain transition"
                  style={pathname === item.href ? { filter: 'brightness(2) saturate(1.8) hue-rotate(15deg)', transform: 'scale(1.15)' } : {}}
                />
              ) : item.href === '/profile' ? (
                isClient && user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 transition"
                    style={pathname === item.href ? { borderColor: '#22c55e', boxShadow: '0 0 12px rgba(34, 197, 94, 0.8)', transform: 'scale(1.1)' } : { borderColor: '#4b5563' }}
                  />
                ) : (
                  <span className="inline-block w-10 h-10 rounded-full bg-gray-700 border-2 transition" style={pathname === item.href ? { borderColor: '#22c55e', boxShadow: '0 0 12px rgba(34, 197, 94, 0.8)', transform: 'scale(1.1)' } : { borderColor: '#4b5563' }} />
                )
              ) : (
                item.icon
              )}
              {item.href === '/profile' && notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}