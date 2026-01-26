'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<'following' | 'not-following'>('not-following');
  const router = useRouter();

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ユーザー検索
  useEffect(() => {
    fetchUsers();
  }, [debouncedQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : '';
      const res = await fetch(`/api/users${query}`, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('ユーザーの取得に失敗しました');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/follows/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      // UIを更新
      setUsers(users.map(u => u.id === targetUserId ? { ...u, isFollowing: true } : u));
    } catch (err) {
      console.error('Follow error:', err);
      alert('フォローに失敗しました');
    }
  };

  const handleUnfollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/follows/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      // UIを更新
      setUsers(users.map(u => u.id === targetUserId ? { ...u, isFollowing: false } : u));
    } catch (err) {
      console.error('Unfollow error:', err);
      alert('フォロー解除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 sticky top-0 z-40 shadow-md">
        <h1 className="text-2xl font-bold text-white mb-4">ユーザーを探す</h1>
        
        {/* 検索バー */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ユーザー名で検索..."
            className="w-full px-4 py-2 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
          <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-400">検索中...</p>
          </div>
        )}

        {!loading && users.length === 0 && debouncedQuery === '' && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">ユーザー名を入力して検索してください</p>
          </div>
        )}

        {!loading && users.length === 0 && debouncedQuery !== '' && (
          <div className="text-center py-12">
            <p className="text-gray-400">「{debouncedQuery}」に該当するユーザーが見つかりません</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <>
            {/* タブ */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab('not-following')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                  tab === 'not-following'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                フォローしてない ({users.filter(u => !u.isFollowing).length})
              </button>
              <button
                onClick={() => setTab('following')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                  tab === 'following'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                フォロー中 ({users.filter(u => u.isFollowing).length})
              </button>
            </div>

            {/* ユーザーリスト */}
            <div className="space-y-3">
              {users
                .filter(u => (tab === 'following' ? u.isFollowing : !u.isFollowing))
                .map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500 transition cursor-pointer"
                    onClick={() => router.push(`/user/${user.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      {/* アバター */}
                      <div
                        className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600 hover:border-green-500 transition cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/user/${user.id}`);
                        }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-400">
                            {user.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* ユーザー情報 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">
                            {user.displayName || user.username}
                          </h3>
                          <span className="text-sm text-gray-400">@{user.username}</span>
                        </div>
                        
                        {user.bio && (
                          <p className="text-sm text-gray-300 mt-1">{user.bio}</p>
                        )}

                        {/* 統計 */}
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          <span>{user._count.posts}投稿</span>
                          <span>{user._count.followers}フォロワー</span>
                          <span>{user._count.following}フォロー中</span>
                        </div>
                      </div>

                      {/* フォローボタン */}
                      {user.isFollowing ? (
                        <button
                          onClick={(e) => handleUnfollow(user.id, e)}
                          className="px-4 py-1 bg-gray-700 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition border border-gray-600 hover:border-red-500"
                        >
                          フォロー中
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleFollow(user.id, e)}
                          className="px-4 py-1 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-500 transition border border-green-500"
                        >
                          フォロー
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
