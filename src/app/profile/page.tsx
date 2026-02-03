'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import ProfileHeader from '../components/ProfileHeader';
import QuestOverlayNew from '../components/QuestOverlayNew';
import Badges, { BadgeData } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount: number;
  friendCount: number;
  level: number;
  gems: number;
  experience: number;
  completedQuestsCount: number;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  tags: string;
  postedAt: string;
  rejectedAt: string | null;
  isApproved: boolean;
  visibilityScope: 'PUBLIC' | 'FRIENDS';
  visibilityDurationMinutes: number | null;
  questId?: string | null;
  quest?: {
    id: string;
    title: string;
    description: string;
    date: string;
  } | null;
}

function ProfilePageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [showQuestOverlay, setShowQuestOverlay] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const router = useRouter();
  const { user: authUser, status, refresh } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // 初期ロード時のみローディング状態を表示
      if (isInitialLoad) {
        // 初期ロード時は待機
        refresh().then(() => {
          fetchLatestUser();
          fetchMyPosts();
          if (authUser?.id) {
            fetchMyBadges(authUser.id);
          }
          setLoading(false);
          setIsInitialLoad(false);
        });
      } else {
        // タブ切り替え時はバックグラウンドで更新（ローディング状態は表示しない）
        refresh();
        fetchLatestUser();
        fetchMyPosts();
        if (authUser?.id) {
          fetchMyBadges(authUser.id);
        }
      }
    }
  }, [status]);

  const fetchLatestUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store'
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching latest user:', error);
    }
  };

  const fetchMyPosts = async () => {
    try {
      const res = await fetch('/api/posts/my-posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchMyBadges = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/badges`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };


  const handleResetTokens = async () => {
    setResetLoading(true);
    try {
      const res = await fetch('/api/posts/shot-tokens/reset', {
        method: 'POST',
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error resetting tokens:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0c0f] via-[#0b0c0f] to-[#0f0f0f] pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
        <ProfileHeader />
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500">読み込み中...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const expPercentage = user.experience ? (user.experience % 100) / 100 * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c0f] via-[#0b0c0f] to-[#0f0f0f] pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <ProfileHeader />

      {loading ? (
        // ローディング中
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : (
        <>
          {/* Profile Card */}
          <div className="mx-3 mt-6 bg-[#14161a] border border-white rounded-2xl p-6 relative">
            {/* Edit Button */}
            <button
              onClick={() => router.push('/profile/edit')}
          className="absolute top-3 left-3 w-6 h-6 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center transition"
        >
          <img src="/icon/Edit.svg" alt="Edit" className="w-5 h-5" />
        </button>

        {/* Bio/Message Box */}
        <div className="absolute top-3 right-3 bg-black/40 border border-white rounded-full px-3 py-1 text-xs text-white max-w-[140px] truncate">
          {user.bio || 'プロフィールなし'}
        </div>

        {/* User Info Section */}
        <div className="flex flex-col items-center gap-1 mb-6 mt-6">
          <div className="w-[72px] h-[72px] rounded-full bg-white border-2 border-white overflow-hidden flex-shrink-0 flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-white text-center">{user.displayName || user.username}</p>
          <p className="text-xs text-[#bfbdbd] text-center">@{user.username}</p>
          <p className="text-[10px] text-[#bfbdbd] text-center">
            登録日 {new Date(user.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* Level and Gems */}
        <div className="flex justify-between items-end gap-6 mb-4 px-8">
          <div className="flex flex-col items-center gap-1">
            <img src="/icon/level_icon_big.svg" alt="Level" className="w-12 h-12" />
            <p className="text-2xl font-bold text-[#ff6d00]">LV{user.level}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <img src="/icon/Gem_Icon_big.svg" alt="Gems" className="w-12 h-12" />
            <p className="text-2xl font-bold text-[#09ffe2]">{user.gems}</p>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="px-8 mb-6">
          <div className="bg-[#475467] border border-white h-2 rounded-full overflow-hidden mb-1">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all"
              style={{ width: `${expPercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-[#bfbdbd] text-center">EXP {user.experience % 100}/100</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white mb-4" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-white">{user.postCount}</p>
            <p className="text-xl font-bold text-white mt-2">投稿</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{user.friendCount}</p>
            <p className="text-xl font-bold text-white mt-2">友達</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{user.completedQuestsCount}</p>
            <p className="text-sm font-bold text-white mt-2">完了した<br />クエスト</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white mt-4" />

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-bold text-white mb-2">バッジ</p>
            <Badges badges={badges} size="md" />
          </div>
        )}

        {/* Debug Button */}
        <button
          onClick={handleResetTokens}
          disabled={resetLoading}
          className="mt-4 w-full px-3 py-2 bg-[#333] hover:bg-[#444] text-xs text-gray-400 rounded-lg border border-gray-600 transition disabled:opacity-50"
        >
          {resetLoading ? '処理中...' : '投稿回数をリセット（デバッグ）'}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-3 w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-sm text-red-400 font-bold rounded-lg border border-red-600/50 transition"
        >
          ログアウト
        </button>
      </div>

      {/* Quest and Shop Buttons */}
      <div className="mx-3 mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            fetch('/api/quests/today')
              .then(res => res.json())
              .then(data => {
                if (data.quests) setQuests(data.quests);
                setShowQuestOverlay(true);
              })
              .catch(err => console.error('クエスト取得エラー:', err));
          }}
          className="bg-[#14161a] border border-white rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
        >
          <img src="/icon/Compass_big.svg" alt="Quest" className="w-12 h-12" />
          <p className="text-2xl font-bold text-white whitespace-nowrap">クエスト</p>
        </button>
        <button
          onClick={() => router.push('/shop')}
          className="bg-[#14161a] border border-white rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
        >
          <img src="/icon/Shopping_cart.svg" alt="Shop" className="w-10 h-10" />
          <p className="text-2xl font-bold text-white whitespace-nowrap">ショップ</p>
        </button>
      </div>

      {/* Your Posts Section */}
      <div className="px-4 mt-8 mb-4">
        <p className="text-2xl font-bold text-white">あなたの投稿</p>
      </div>

      {posts.length === 0 ? (
        <div className="mx-4 bg-[#14161a] rounded-2xl p-8 text-center border border-white">
          <p className="text-[#bfbdbd]">まだ投稿がありません</p>
          <button
            onClick={() => router.push('/post')}
            className="mt-4 px-4 py-2 bg-[#00e676] hover:bg-[#00d664] text-white rounded-lg text-sm font-bold border border-[#00e676] transition"
          >
            最初の一枚を投稿
          </button>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-3 gap-2 mb-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square bg-[#14161a] rounded-xl overflow-hidden border border-white relative group"
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#bfbdbd] text-2xl">
                  📸
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </>
      )}

      <BottomNav />
      
      {/* クエストオーバーレイ */}
      <QuestOverlayNew
        open={showQuestOverlay}
        quests={quests}
        onClose={() => setShowQuestOverlay(false)}
      />
    </div>
  );
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}