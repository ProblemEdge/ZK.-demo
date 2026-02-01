'use client';

import { useRouter } from 'next/navigation';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';
type Mode = 'world' | 'following';

interface RankingsHeaderProps {
  period: Period;
  mode: Mode;
  onPeriodChange: (period: Period) => void;
  onModeChange: (mode: Mode) => void;
}

export default function RankingsHeader({ period, mode, onPeriodChange, onModeChange }: RankingsHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="relative h-[65px] px-3 flex items-center">
        <div className="w-6 h-6" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white whitespace-nowrap">🏆 ランキング</h1>
        <button
          onClick={() => router.back()}
          className="ml-auto w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* モード切り替え */}
      <div className="flex gap-2 mb-3 px-3">
        <button
          onClick={() => onModeChange('world')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            mode === 'world'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🌍 世界
        </button>
        <button
          onClick={() => onModeChange('following')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            mode === 'following'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          👥 身内
        </button>
      </div>

      {/* 期間フィルター */}
      <div className="flex gap-1 overflow-x-auto pb-1 px-3">
        {(['today', 'week', 'month', 'year', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              period === p
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {p === 'today' && '今日'}
            {p === 'week' && '今週'}
            {p === 'month' && '今月'}
            {p === 'year' && '今年'}
            {p === 'all' && '全部'}
          </button>
        ))}
      </div>
    </header>
  );
}
