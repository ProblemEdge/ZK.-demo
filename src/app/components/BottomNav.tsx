'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageWithPlaceholder from '@/app/components/ImageWithPlaceholder';

export default function BottomNav() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState<string | null>(null);
  const { user } = useAuth();

  const imgFeedIcon = '/icon/feed_icon.svg';
  const imgPostIcon = '/icon/post_icon.svg';
  const imgPeopleIcon = '/icon/people_icon.svg';
  const imgProfileIcon = '/icon/profile_icon.svg';
  const imgVoteIcon = '/icon/vote_icon.svg';

  const navItems = useMemo(
    () => [
      { href: '/feed', label: 'ホーム', type: 'feed' as const },
      { href: '/vote', label: '投票', type: 'vote' as const },
      { href: '/post', label: '投稿', type: 'post' as const },
      { href: '/discover', label: 'ユーザー', type: 'discover' as const },
      { href: '/profile', label: 'プロフィール', type: 'profile' as const }
    ],
    []
  );

  useEffect(() => {
    setIsClient(true);
    try {
      if (typeof window !== 'undefined' && user?.id) {
        const vb = localStorage.getItem(`avatar_v_${user.id}`) || null;
        setAvatarVersion(vb);
      }
    } catch {}

    const onStorage = (e: StorageEvent) => {
      try {
        if (!user) return;
        if (e.key === `avatar_v_${user.id}`) setAvatarVersion(e.newValue);
      } catch {}
    };

    const onAvatarUpdated = (e: Event) => {
      try {
        const detail: any = (e as CustomEvent).detail;
        if (!detail || !detail.userId) return;
        const myId = user?.id || null;
        if (detail.userId === myId) {
          const vb = myId ? localStorage.getItem(`avatar_v_${myId}`) : null;
          setAvatarVersion(vb);
        }
      } catch {}
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('avatar-updated', onAvatarUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('avatar-updated', onAvatarUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
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

    // タブを表示したときのみ取得（ポーリング廃止）
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const getLinkClasses = (href: string) =>
    `flex items-center justify-center transition ${pathname === href ? 'opacity-100' : 'opacity-70'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0b0c0f] border-t-4 border-white z-50" style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}>
      <div className="flex items-center justify-center gap-8 px-4 py-2" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={getLinkClasses(item.href)}>
            {item.type === 'feed' && (
              <img src={imgFeedIcon} alt="ホーム" className="w-[62px] h-[48px] shrink-0" />
            )}
            {item.type === 'vote' && (
              <img src={imgVoteIcon} alt="投票" className="w-[48px] h-[48px] shrink-0" />
            )}
            {item.type === 'post' && (
              <img src={imgPostIcon} alt="投稿" className="w-[75px] h-[75px] shrink-0" />
            )}
            {item.type === 'discover' && (
              <img src={imgPeopleIcon} alt="ユーザー" className="w-[48px] h-[48px] shrink-0" />
            )}
            {item.type === 'profile' && (
              <span className="relative inline-flex items-center justify-center w-[48px] h-[48px]">
                {isClient && user?.avatarUrl ? (
                  (() => {
                    const filename = user.avatarUrl.split('/').pop()?.split('?')[0];
                    const fallback = filename ? `/uploads/avatars/${filename}` : undefined;
                    let src = user.avatarUrl;
                    try {
                      if (avatarVersion) src = `${src}${src.includes('?') ? '&' : '?'}v=${avatarVersion}`;
                    } catch {}
                    return (
                      <ImageWithPlaceholder
                        src={src}
                        alt={user.displayName || user.username}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                        fallbackInitial={(user.displayName || user.username)[0].toUpperCase()}
                        fallbackSrc={fallback}
                      />
                    );
                  })()
                ) : (
                  <img src={imgProfileIcon} alt="プロフィール" className="w-full h-full" />
                )}
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}