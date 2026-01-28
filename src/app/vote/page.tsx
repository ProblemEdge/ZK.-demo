'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { useReward } from '../context/RewardContext';

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  tags: string;
  postedAt: string;
  visibilityDurationMinutes: number | null;
  questId?: string | null;
  quest?: {
    id: string;
    title: string;
    description: string;
  } | null;
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
  likeCount?: number;
  hasLiked?: boolean;
  commentCount?: number;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export default function VotePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'normal' | 'quest'>('all');
  const [voteStatusTab, setVoteStatusTab] = useState<'unvoted' | 'voted'>('unvoted');
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date()); // タイマー用
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser();
    fetchPendingPosts();
    fetchQuests();

    // 1秒ごとに時刻を更新してタイマーを動作させる
    const timerInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.id);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  useEffect(() => {
    // 1分ごとに最新の投稿を再取得
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchPendingPosts();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 5分ごとに期限切れの投票を処理
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      processExpiredVotes();
    }, 300000);

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

  const fetchQuests = async () => {
    try {
      const res = await fetch('/api/quests/today', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests || []);
        // 初期選択: 最初の未達成クエスト
        const firstIncomplete = data.quests?.find((q: any) => !q.completed);
        if (firstIncomplete) {
          setSelectedQuestId(firstIncomplete.id);
        }
      }
    } catch (e) {
      console.error('Error fetching quests:', e);
    }
  };

  const resetQuests = async () => {
    try {
      const res = await fetch('/api/quests/today/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchQuests();
      }
    } catch (e) {
      console.error('Error resetting quests:', e);
    }
  };

  const { showReward } = useReward();

  const handleVote = async (postId: string, voteType: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/votes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, voteType })
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Vote error:', data.error);
        return;
      }

      const data = await res.json();

      // 報酬通知を表示
      if (data.reward) {
        showReward({
          ...data.reward,
          message: '投票に参加しました！'
        });
      }

      // 5票に達したら投稿を一覧から削除
      if (data.isComplete) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        // 投票二二作次立て、最新データを再取得してUI更新
        await fetchPendingPosts(); // 最新データを取得
      }

    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  // 投票期限は5分固定
  const isVotingClosed = (postedAt: string): boolean => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return postTime < fiveMinutesAgo;
  };

  // 残り投票時間を計算（5分固定）
  const getTimeRemaining = (postedAt: string): string => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAfter = postTime + 5 * 60 * 1000;
    const timeLeft = fiveMinutesAfter - now.getTime();

    if (timeLeft <= 0) return '投票終了';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.hasLiked) {
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          console.error('Like delete error');
          return;
        }

        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, hasLiked: false, likeCount: (p.likeCount || 0) - 1 }
            : p
        ));
      } else {
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: 'POST'
        });

        if (!res.ok) {
          console.error('Like error');
          return;
        }

        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, hasLiked: true, likeCount: (p.likeCount || 0) + 1 }
            : p
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        console.error('Comment post error');
        return;
      }

      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));

      await fetchComments(postId);
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      if (!comments[postId]) {
        await fetchComments(postId);
      }
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments({ ...loadingComments, [postId]: true });
      const res = await fetch(`/api/posts/${postId}/comments`);

      if (res.ok) {
        const data = await res.json();
        setComments({ ...comments, [postId]: data });
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('コメントを削除しますか？')) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        console.error('Delete comment error');
        return;
      }

      setComments({
        ...comments,
        [postId]: (comments[postId] || []).filter(c => c.id !== commentId)
      });

      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, commentCount: (p.commentCount || 1) - 1 }
          : p
      ));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pb-20">
        <p className="text-gray-300">読み込み中...</p>
      </div>
    );
  }

  // タブに応じて投稿をフィルタリング
  const filteredPosts = posts
    .filter(p => {
      if (tab === 'all') return true;
      if (tab === 'quest') {
        if (selectedQuestId === 'all') return !!p.questId;
        return p.questId === selectedQuestId;
      }
      return !p.questId;
    })
    .filter(p => voteStatusTab === 'voted' ? p.hasVoted : !p.hasVoted);

  const selectedQuest = quests.find(q => q.id === selectedQuestId);

  return (
    <div className="min-h-screen bg-gray-900" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 sticky z-40 shadow-md" style={{ top: '0' }}>
        <div style={{ paddingTop: 'var(--safe-area-top)', padding: '1rem' }}>
          <h1 className="text-2xl font-bold text-white">投票</h1>
          <p className="text-sm text-gray-300 mt-1">現在承認されていない投稿に投票して、松本関連かを判定しよう</p>
        </div>
      </header>

      {/* メインタブ（通常/クエスト） */}
      <div className="flex gap-2 p-4 border-b border-gray-700 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
        <button
          onClick={() => setTab('all')}
          className={`px-3 py-2 rounded-full text-xs font-semibold transition flex-1 ${
            tab === 'all'
              ? 'bg-gray-600 text-white shadow-lg shadow-gray-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          📋 すべて
        </button>
        <button
          onClick={() => setTab('normal')}
          className={`px-3 py-2 rounded-full text-xs font-semibold transition flex-1 ${
            tab === 'normal'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          📸 通常
        </button>
        <button
          onClick={() => setTab('quest')}
          className={`px-3 py-2 rounded-full text-xs font-semibold transition flex-1 ${
            tab === 'quest'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          ✨ クエスト
        </button>
      </div>

      {/* クエスト選択UI */}
      {tab === 'quest' && (
        <div className="p-4 bg-gray-800/50 border-b border-gray-700">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">今日のクエスト</h3>
              <button
                onClick={resetQuests}
                className="text-xs px-3 py-1 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-600/50 transition font-medium"
              >
                🔄 リセット
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedQuestId('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedQuestId === 'all'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                すべて
              </button>
              {quests.map((quest) => (
                <button
                  key={quest.id}
                  onClick={() => setSelectedQuestId(quest.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedQuestId === quest.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  {quest.title} {quest.completed && '✓'}
                </button>
              ))}
            </div>
            {selectedQuest && (
              <p className="mt-3 text-sm text-gray-400">{selectedQuest.description}</p>
            )}
          </div>
        </div>
      )}

      {/* サブタブ（未投票/投票済み） */}
      <div className="flex gap-2 p-4 border-b border-gray-700 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
        <button
          onClick={() => setVoteStatusTab('unvoted')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
            voteStatusTab === 'unvoted'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          未投票 ({posts.filter(p => {
            if (tab === 'all') return true;
            if (tab === 'quest') {
              if (selectedQuestId === 'all') return !!p.questId;
              return p.questId === selectedQuestId;
            }
            return !p.questId;
          }).filter(p => !p.hasVoted).length})
        </button>
        <button
          onClick={() => setVoteStatusTab('voted')}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
            voteStatusTab === 'voted'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          投票済み ({posts.filter(p => {
            if (tab === 'all') return true;
            if (tab === 'quest') {
              if (selectedQuestId === 'all') return !!p.questId;
              return p.questId === selectedQuestId;
            }
            return !p.questId;
          }).filter(p => p.hasVoted).length})
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
              {voteStatusTab === 'voted' ? '投票済みの投稿がありません' : '現在投票中の投稿がありません'}
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
                      投票: {post.totalVotes}/10
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
                    disabled={post.hasVoted || isVotingClosed(post.postedAt) || post.totalVotes >= 5 || post.userId === currentUserId}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-600 border border-green-500 shadow-lg shadow-green-600/30"
                  >
                    {post.questId ? '✅ OK' : '✅ 松本関連'}
                  </button>
                  <button
                    onClick={() => handleVote(post.id, 'reject')}
                    disabled={post.hasVoted || isVotingClosed(post.postedAt) || post.totalVotes >= 5 || post.userId === currentUserId}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-600 border border-red-500 shadow-lg shadow-red-600/30"
                  >
                    {post.questId ? '❌ なし' : '❌ 関連なし'}
                  </button>
                </div>

                {/* いいね・コメント欄 */}
                <div className="p-4 border-t border-gray-700 space-y-3">
                  <div className="flex gap-6 text-sm">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition ${
                        post.hasLiked
                          ? 'text-red-500 hover:text-red-400'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <span className="text-lg">{post.hasLiked ? '❤️' : '🤍'}</span>
                      <span className="font-semibold">{post.likeCount || 0}</span>
                    </button>
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition"
                    >
                      <span className="text-lg">💬</span>
                      <span className="font-semibold">{post.commentCount || 0}</span>
                    </button>
                  </div>

                  {/* コメント一覧 */}
                  {expandedPostId === post.id && (
                    <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-900 rounded-lg p-3 border border-gray-600">
                      {loadingComments[post.id] ? (
                        <div className="text-center text-gray-400 text-sm py-4">読み込み中...</div>
                      ) : comments[post.id]?.length > 0 ? (
                        comments[post.id].map((comment) => (
                          <div key={comment.id} className="flex gap-2 items-start">
                            <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {comment.user.avatarUrl ? (
                                <img
                                  src={comment.user.avatarUrl}
                                  alt={comment.user.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-400">
                                  {comment.user.username[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 bg-gray-800 rounded-lg p-2 border border-gray-700">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-semibold text-white">
                                  {comment.user.displayName || comment.user.username}
                                </p>
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="text-xs text-red-400 hover:text-red-300 transition"
                                >
                                  削除
                                </button>
                              </div>
                              <p className="text-sm text-gray-200">{comment.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(comment.createdAt).toLocaleString('ja-JP')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-400 text-sm py-4">コメントがありません</div>
                      )}
                    </div>
                  )}

                  {/* コメント入力欄 */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="コメントを入力..."
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-green-500 transition"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          handleComment(post.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                        if (input && input.value.trim()) {
                          handleComment(post.id, input.value);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition text-sm border border-green-500"
                    >
                      送信
                    </button>
                  </div>
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