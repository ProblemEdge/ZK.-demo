'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  tags: string;
  postedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  approveCount: number;
  rejectCount: number;
  totalVotes: number;
  approvePercentage: number;
  hasVoted: boolean;
}

export default function VotePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'unvoted' | 'voted'>('unvoted');
  const [now, setNow] = useState(new Date()); // タイマー用
  const router = useRouter();

  useEffect(() => {
    fetchPendingPosts();

    // 1秒ごとに時刻を更新してタイマーを動作させる
    const timerInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    // 1分ごとに期限切れの投票を処理
    const interval = setInterval(() => {
      processExpiredVotes();
      fetchPendingPosts(); // 最新の投稿を再取得
    }, 60000); // 60秒ごと

    return () => clearInterval(interval);
  }, []);

  const processExpiredVotes = async () => {
    try {
      await fetch('/api/votes/process-expired');
    } catch (err) {
      console.error('Error processing expired votes:', err);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const res = await fetch('/api/posts/pending');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string, voteType: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/votes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, voteType })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      const data = await res.json();

      // 5票に達したら投稿を一覧から削除
      if (data.isComplete) {
        setPosts(posts.filter(p => p.id !== postId));
        alert(data.approved ? '承認されました！' : '却下されました');
      } else {
        // 投票二二作次立て、最新データを再取得してUI更新
        alert(voteType === 'approve' ? '承認に投票しました' : '却下に投票しました');
        await fetchPendingPosts(); // 最新データを取得
      }

    } catch (err) {
      console.error('Vote error:', err);
      alert('投票に失敗しました');
    }
  };

  // 投稿から5分以上経っているかチェック
  const isVotingClosed = (postedAt: string): boolean => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return postTime < fiveMinutesAgo;
  };

  // 残り投票時間を計算
  const getTimeRemaining = (postedAt: string): string => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAfter = postTime + 5 * 60 * 1000;
    const timeLeft = fiveMinutesAfter - now.getTime(); // now を使用

    if (timeLeft <= 0) return '投票終了';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pb-20">
        <p className="text-gray-300">読み込み中...</p>
      </div>
    );
  }

  // タブに応じて投稿をフィルタリング
  const filteredPosts = tab === 'voted' 
    ? posts.filter(p => p.hasVoted)
    : posts.filter(p => !p.hasVoted);

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 sticky top-0 z-40 shadow-md">
        <h1 className="text-2xl font-bold text-white">投票</h1>
        <p className="text-sm text-gray-300 mt-1">現在承認されていない投稿に投票して、松本関連かを判定しよう</p>
      </header>

      {/* タブ粗ゾーン */}
      <div className="flex gap-2 p-4 border-b border-gray-700 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
        <button
          onClick={() => setTab('unvoted')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
            tab === 'unvoted'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          未投票 ({posts.filter(p => !p.hasVoted).length})
        </button>
        <button
          onClick={() => setTab('voted')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
            tab === 'voted'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          投票済み ({posts.filter(p => p.hasVoted).length})
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-900/80 text-red-200 p-3 rounded-lg mb-4 border border-red-700">
            {error}
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <p className="text-gray-300 text-lg">
              {tab === 'voted' ? '描画済みの投稿がありません' : '現在投票中の投稿がありません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700"
              >
                {/* 投稿者情報 */}
                <div className="p-4 border-b border-gray-700 flex items-center">
                  <div className="w-10 h-10 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
                    {post.user.avatarUrl ? (
                      <img
                        src={post.user.avatarUrl}
                        alt={post.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold">
                        {post.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-white">
                      {post.user.displayName || post.user.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      @{post.user.username}
                    </p>
                  </div>
                </div>

                {/* 投稿画像 */}
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-64 object-cover"
                />

                {/* キャプションとタグ */}
                <div className="p-4">
                  <p className="text-gray-100 mb-2 leading-relaxed">{post.caption}</p>
                  {post.tags && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.split(',').map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-700 text-gray-200 px-3 py-1 rounded-full border border-gray-600 font-semibold"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 投票の割合表示 */}
                <div className="p-4 bg-gray-700/50 border-t border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-white">
                      投票: {post.totalVotes}/5
                    </span>
                    <span className="text-sm font-bold text-green-400">
                      {getTimeRemaining(post.postedAt)}
                    </span>
                  </div>

                  {post.totalVotes > 0 ? (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-semibold text-green-400">✅ {post.approveCount}票 / ❌ {post.rejectCount}票</span>
                        <span className="text-xs text-gray-300 font-medium">{post.approvePercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-6 overflow-hidden border border-gray-500 flex">
                        <div
                          className="bg-green-600 h-full transition-all shadow-lg shadow-green-600/50"
                          style={{ width: `${post.approvePercentage}%` }}
                        />
                        <div
                          className="bg-red-600 h-full transition-all shadow-lg shadow-red-600/50"
                          style={{ width: `${100 - post.approvePercentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-2 font-medium">
                      投票なし
                    </div>
                  )}
                </div>

                {/* 投票ボタン */}
                <div className="p-4 border-t border-gray-700 flex gap-3">
                  <button
                    onClick={() => handleVote(post.id, 'approve')}
                    disabled={post.hasVoted || isVotingClosed(post.postedAt) || post.totalVotes >= 5}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-600 border border-green-500 shadow-lg shadow-green-600/30"
                  >
                    ✅ 松本関連
                  </button>
                  <button
                    onClick={() => handleVote(post.id, 'reject')}
                    disabled={post.hasVoted || isVotingClosed(post.postedAt) || post.totalVotes >= 5}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-600 border border-red-500 shadow-lg shadow-red-600/30"
                  >
                    ❌ 関連なし
                  </button>
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