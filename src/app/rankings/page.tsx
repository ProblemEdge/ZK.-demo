'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import RankingsHeader from '../components/RankingsHeader';

interface RankingUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  gems: number;
  totalVotes?: number;
  votedCount?: number;
  totalLikes?: number;
  completedCount?: number;
  avgCompletionTime?: number;
}

type RankingType = 'level' | 'gems' | 'votes' | 'voted' | 'likes' | 'quest-speed';
type Period = 'today' | 'week' | 'month' | 'year' | 'all';
type Mode = 'world' | 'following';

export default function RankingsPage() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankingType, setRankingType] = useState<RankingType>('level');
  const [period, setPeriod] = useState<Period>('all');
  const [mode, setMode] = useState<Mode>('world');
  const router = useRouter();

  useEffect(() => {
    fetchRanking();
  }, [rankingType, period, mode]);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      console.log('=== フロントエンド: Fetching ranking ===');
      console.log('Type:', rankingType, 'Period:', period, 'Mode:', mode);
      
      const res = await fetch(
        `/api/rankings?type=${rankingType}&period=${period}&mode=${mode}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        throw new Error('ランキング取得に失敗');
      }

      const data = await res.json();
      console.log('Received ranking data:', data);
      setRanking(data.ranking);
    } catch (err) {
      console.error('Error fetching ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankingTitle = () => {
    switch (rankingType) {
      case 'level':
        return 'レベルランキング';
      case 'gems':
        return 'ジェムランキング';
      case 'votes':
        return 'もらった投票数ランキング';
      case 'voted':
        return '投票した回数ランキング';
      case 'likes':
        return 'いいねされた回数ランキング';
      case 'quest-speed':
        return 'クエスト処理速度ランキング';
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return '今日';
      case 'week':
        return '今週';
      case 'month':
        return '今月';
      case 'year':
        return '今年';
      case 'all':
        return '全期間';
    }
  };

  const rankingTabs: { type: RankingType; label: string; icon: string }[] = [
    { type: 'level', label: 'LV', icon: '📈' },
    { type: 'gems', label: 'ジェム', icon: '💎' },
    { type: 'votes', label: 'もらった投票', icon: '🗳️' },
    { type: 'voted', label: '投票した数', icon: '✅' },
    { type: 'likes', label: 'いいね数', icon: '❤️' },
    { type: 'quest-speed', label: 'クエスト速度', icon: '⚡' }
  ];

  const uniqueRankingTabs = rankingTabs.filter((item, index, self) => {
    const firstMatchIndex = self.findIndex(
      tab => tab.type === item.type || tab.label === item.label
    );
    return firstMatchIndex === index;
  });

  return (
    <div className="min-h-screen bg-gray-900 pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="fixed left-0 right-0 top-0 z-40" style={{ paddingTop: 'var(--safe-area-top)' }}>
        <RankingsHeader
          period={period}
          mode={mode}
          onPeriodChange={setPeriod}
          onModeChange={setMode}
        />
      </div>

      {/* ランキングタイプ選択 */}
      <div className="pt-36 px-3 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {uniqueRankingTabs.map(item => (
            <button
              key={item.type}
              onClick={() => {
                console.log('Button clicked:', item.type);
                setRankingType(item.type);
              }}
              className={`p-3 rounded-lg font-semibold transition border ${
                rankingType === item.type
                  ? 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ランキングリスト */}
      <div className="px-3">
        <h2 className="text-lg font-bold text-white mb-3">
          {getRankingTitle()} ({getPeriodLabel()})
        </h2>

        {loading ? (
          <div className="text-center text-gray-400 py-8">読み込み中...</div>
        ) : ranking.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            ランキングデータがありません
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((user, index) => (
              <div
                key={user.id}
                className="bg-gray-800 rounded-lg p-2 border border-gray-700 hover:border-green-500 transition cursor-pointer flex items-center gap-2"
                onClick={() => router.push(`/user/${user.id}`)}
              >
                {/* ランク */}
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-700 font-bold text-white flex-shrink-0 text-sm">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index >= 3 && `${index + 1}`}
                </div>

                {/* ユーザー情報 */}
                <div className="w-9 h-9 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate text-sm">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                </div>

                {/* スコア表示 */}
                <div className="text-right flex-shrink-0">
                  {rankingType === 'level' && (
                    <div>
                      <p className="text-base font-bold text-blue-400">LV {user.level}</p>
                      <p className="text-xs text-gray-400">💎 {user.gems}</p>
                    </div>
                  )}
                  {rankingType === 'gems' && (
                    <p className="text-base font-bold text-yellow-400">💎 {user.gems}</p>
                  )}
                  {rankingType === 'votes' && (
                    <p className="text-base font-bold text-green-400">
                      {user.totalVotes ?? 0}票
                    </p>
                  )}
                  {rankingType === 'voted' && (
                    <p className="text-base font-bold text-blue-400">
                      {user.votedCount ?? 0}回
                    </p>
                  )}
                  {rankingType === 'likes' && (
                    <p className="text-base font-bold text-pink-400">
                      ❤️ {user.totalLikes ?? 0}
                    </p>
                  )}
                  {rankingType === 'quest-speed' && (
                    <div>
                      <p className="text-base font-bold text-purple-400">
                        {user.completedCount ?? 0}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.avgCompletionTime
                          ? `${Math.floor(user.avgCompletionTime / 60000)}分`
                          : '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
