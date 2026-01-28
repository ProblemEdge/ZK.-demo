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
  isRequested?: boolean;
}

interface RankingUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  gems: number;
  totalVotes?: number;
  avgCompletionTime?: number;
  completedCount?: number;
}

type MainTab = 'search' | 'ranking';
type RankingType = 'level' | 'gems' | 'votes' | 'quest-speed';
type Period = 'today' | 'week' | 'month' | 'year' | 'all';
type Mode = 'world' | 'following';

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<'following' | 'not-following'>('not-following');
  const [mainTab, setMainTab] = useState<MainTab>('search');
  
  // ランキング関連
  const [rankingType, setRankingType] = useState<RankingType>('level');
  const [period, setPeriod] = useState<Period>('all');
  const [mode, setMode] = useState<Mode>('world');
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  
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
    if (mainTab === 'search') {
      fetchUsers();
    }
  }, [debouncedQuery, mainTab]);

  // ランキング取得
  useEffect(() => {
    if (mainTab === 'ranking') {
      fetchRanking();
    }
  }, [rankingType, period, mode, mainTab]);

  const fetchRanking = async () => {
    try {
      setRankingLoading(true);
      const res = await fetch(
        `/api/rankings?type=${rankingType}&period=${period}&mode=${mode}`,
        { cache: 'no-store' }
      );

      if (!res.ok) throw new Error('ランキングの取得に失敗しました');

      const data = await res.json();
      setRanking(data.ranking);
    } catch (err) {
      console.error('Ranking error:', err);
      setRanking([]);
    } finally {
      setRankingLoading(false);
    }
  };

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
      setUsers(users.map(u => u.id === targetUserId ? { ...u, isFollowing: false, isRequested: true } : u));
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
    <div className="min-h-screen bg-gray-900" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 sticky z-40 shadow-md" style={{ top: '0', paddingBottom: '0.75rem' }}>
        <div style={{ paddingTop: 'var(--safe-area-top)', paddingLeft: '0.75rem', paddingRight: '0.75rem', paddingBottom: '0.75rem' }}>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMainTab('search')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              mainTab === 'search'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            🔍 ユーザー検索
          </button>
          <button
            onClick={() => setMainTab('ranking')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              mainTab === 'ranking'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            🏆 ランキング
          </button>
        </div>
        
        {/* 検索バー（検索タブ時のみ） */}
        {mainTab === 'search' && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ユーザー名で検索..."
              className="w-full px-4 py-2 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <img
              src="/icon_people.png"
              alt="検索"
              className="absolute right-3 top-2.5 w-5 h-5 object-contain"
            />
          </div>
        )}

        {/* ランキングフィルター（ランキングタブ時のみ） */}
        {mainTab === 'ranking' && (
          <div className="space-y-2">
            {/* ランキング種類 */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setRankingType('level')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  rankingType === 'level'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                📊 レベル
              </button>
              <button
                onClick={() => setRankingType('gems')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  rankingType === 'gems'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                💎 ジェム
              </button>
              <button
                onClick={() => setRankingType('votes')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  rankingType === 'votes'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                ✅ 投票数
              </button>
              <button
                onClick={() => setRankingType('quest-speed')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  rankingType === 'quest-speed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                ⚡ クエスト速度
              </button>
            </div>

            {/* 期間とモード */}
            <div className="flex gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="flex-1 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-700"
              >
                <option value="today">今日</option>
                <option value="week">今週</option>
                <option value="month">今月</option>
                <option value="year">今年</option>
                <option value="all">全期間</option>
              </select>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="flex-1 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-700"
              >
                <option value="world">🌍 ワールド</option>
                <option value="following">👥 フォロー中</option>
              </select>
            </div>
          </div>
        )}
        </div>
      </header>

      <div className="p-3 max-w-2xl mx-auto">
        {/* 検索タブコンテンツ */}
        {mainTab === 'search' && (
          <>
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
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setTab('not-following')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition ${
                      tab === 'not-following'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    フォローしてない ({users.filter(u => !u.isFollowing).length})
                  </button>
                  <button
                    onClick={() => setTab('following')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition ${
                      tab === 'following'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    フォロー中 ({users.filter(u => u.isFollowing).length})
                  </button>
                </div>

                {/* ユーザーリスト */}
                <div className="space-y-2">
                  {users
                    .filter(u => (tab === 'following' ? u.isFollowing : !u.isFollowing))
                    .map((user) => (
                      <div
                        key={user.id}
                        className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-green-500 transition cursor-pointer"
                        onClick={() => router.push(`/user/${user.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          {/* アバター */}
                          <div
                            className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600"
                          >
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-400">
                                {user.username[0].toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* ユーザー情報 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm truncate">
                                {user.displayName || user.username}
                              </h3>
                              <span className="text-xs text-gray-400">@{user.username}</span>
                            </div>
                            
                            {user.bio && (
                              <p className="text-xs text-gray-300 mt-1 line-clamp-2">{user.bio}</p>
                            )}

                            {/* 統計 */}
                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                              <span>{user._count.posts}投稿</span>
                              <span>{user._count.followers}フォロワー</span>
                              <span>{user._count.following}フォロー中</span>
                            </div>
                          </div>

                          {/* フォローボタン */}
                          {user.isFollowing ? (
                            <button
                              onClick={(e) => handleUnfollow(user.id, e)}
                              className="px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-bold hover:bg-red-600 transition"
                            >
                              フォロー中
                            </button>
                          ) : user.isRequested ? (
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1 bg-gray-600 text-gray-200 rounded-full text-xs font-bold opacity-70 cursor-not-allowed"
                              disabled
                            >
                              リクエスト済み
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleFollow(user.id, e)}
                              className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold hover:bg-green-500 transition"
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
          </>
        )}

        {/* ランキングタブコンテンツ */}
        {mainTab === 'ranking' && (
          <>
            {rankingLoading && (
              <div className="text-center py-8">
                <p className="text-gray-400">読み込み中...</p>
              </div>
            )}

            {!rankingLoading && ranking.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">ランキングデータがありません</p>
              </div>
            )}

            {!rankingLoading && ranking.length > 0 && (
              <div className="space-y-2">
                {ranking.map((user, index) => (
                  <div
                    key={user.id}
                    className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-green-500 transition cursor-pointer"
                    onClick={() => router.push(`/user/${user.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 順位 */}
                      <div className="w-8 flex-shrink-0 text-center">
                        {index === 0 && <span className="text-2xl">🥇</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-2xl">🥉</span>}
                        {index > 2 && (
                          <span className="text-lg font-bold text-gray-400">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* アバター */}
                      <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">
                            {user.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>

                      {/* スコア */}
                      <div className="text-right">
                        {rankingType === 'level' && (
                          <div className="text-sm font-bold text-blue-400">
                            LV {user.level}
                          </div>
                        )}
                        {rankingType === 'gems' && (
                          <div className="text-sm font-bold text-yellow-400">
                            💎 {user.gems}
                          </div>
                        )}
                        {rankingType === 'votes' && (
                          <div className="text-sm font-bold text-green-400">
                            ✅ {user.totalVotes}票
                          </div>
                        )}
                        {rankingType === 'quest-speed' && user.avgCompletionTime !== undefined && (
                          <div className="text-sm font-bold text-purple-400">
                            ⚡ {Math.floor(user.avgCompletionTime / 1000 / 60)}分
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
