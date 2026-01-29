'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { useReward } from '../context/RewardContext';
import type { MapPost } from '../components/FeedMap';

const FeedMap = dynamic(() => import('../components/FeedMap'), { ssr: false });

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  tags: string;
  postedAt: string;
  isApproved: boolean;
  rejectedAt: string | null;
  questId?: string | null;
  quest?: {
    id: string;
    title: string;
    description: string;
    date: string;
  } | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  approveCount?: number;
  rejectCount?: number;
  totalVotes?: number;
  hasVoted?: boolean;
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

interface FeedResponse {
  approved: Post[];
  voting: Post[];
}

export default function FeedPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'following' | 'all'>('following');
  const [viewTab, setViewTab] = useState<'feed' | 'map'>('feed');
  const [now, setNow] = useState(new Date());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [mapPosts, setMapPosts] = useState<MapPost[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    checkRewards(); // ページ読み込み時に報酬をチェック
  }, []);

  useEffect(() => {
    if (viewTab === 'feed') {
      fetchPosts();
    }
  }, [tab, viewTab]);

  useEffect(() => {
    if (viewTab === 'map') {
      fetchMapPosts();
    }
  }, [viewTab]);

  useEffect(() => {
    if (viewTab !== 'feed') return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [viewTab]);

  useEffect(() => {
    if (viewTab !== 'feed') return;
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      processExpiredVotes();
    }, 300000);
    return () => clearInterval(interval);
  }, [viewTab]);

  const processExpiredVotes = async () => {
    try {
      await fetch('/api/votes/process-expired');
    } catch (err) {
      console.error('Error processing expired votes:', err);
    }
  };

  const { showReward } = useReward();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setCurrentUserId(data.id);
    } catch {
      router.push('/login');
    }
  };

  // 報酬をチェックする関数
  const checkRewards = async () => {
    try {
      const res = await fetch('/api/notifications/check-rewards');
      if (res.ok) {
        const data = await res.json();
        if (data.hasReward && data.reward) {
          showReward(data.reward);
        }
      }
    } catch (err) {
      console.error('Reward check error:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/feed?tab=${tab}`, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data: FeedResponse = await res.json();
      const combinedPosts = [...data.voting, ...data.approved];
      setAllPosts(combinedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapPosts = async () => {
    try {
      setMapLoading(true);
      const res = await fetch('/api/feed/map', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('マップ投稿の取得に失敗しました');
      }
      const data = await res.json();
      setMapPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching map posts:', err);
      setMapPosts([]);
    } finally {
      setMapLoading(false);
    }
  };

  const isVotingClosed = (postedAt: string): boolean => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return postTime < fiveMinutesAgo;
  };

  const getTimeRemaining = (postedAt: string): string => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAfter = postTime + 5 * 60 * 1000;
    const timeLeft = fiveMinutesAfter - now.getTime();

    if (timeLeft <= 0) return '投票終了';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVote = useCallback(async (postId: string, voteType: 'approve' | 'reject') => {
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
      
      await fetchPosts();
    } catch (err) {
      console.error('Vote error:', err);
    }
  }, [showReward]);

  const handleLike = async (postId: string) => {
    try {
      const post = allPosts.find((p) => p.id === postId);
      if (!post) return;

      if (post.hasLiked) {
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          console.error('Like delete error');
          return;
        }

        setAllPosts(
          allPosts.map((p) =>
            p.id === postId
              ? { ...p, hasLiked: false, likeCount: (p.likeCount || 0) - 1 }
              : p
          )
        );
      } else {
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: 'POST'
        });

        if (!res.ok) {
          console.error('Like error');
          return;
        }

        setAllPosts(
          allPosts.map((p) =>
            p.id === postId
              ? { ...p, hasLiked: true, likeCount: (p.likeCount || 0) + 1 }
              : p
          )
        );
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

      setAllPosts(
        allPosts.map((p) =>
          p.id === postId
            ? { ...p, commentCount: (p.commentCount || 0) + 1 }
            : p
        )
      );

      await fetchComments(postId);
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleToggleComments = useCallback((postId: string) => {
    setExpandedPostId(prevId => {
      if (prevId === postId) {
        return null;
      } else {
        if (!comments[postId]) {
          fetchComments(postId);
        }
        return postId;
      }
    });
  }, [comments]);

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
        [postId]: (comments[postId] || []).filter((c) => c.id !== commentId)
      });

      setAllPosts(
        allPosts.map((p) =>
          p.id === postId
            ? { ...p, commentCount: (p.commentCount || 1) - 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <header className="fixed left-0 right-0 z-40 bg-black border-b border-gray-800" style={{ top: '0', height: 'calc(5rem + var(--safe-area-top))', display: 'flex', alignItems: 'flex-end' }}>
        <div className="w-full p-4 flex justify-between items-center" style={{ paddingTop: 'var(--safe-area-top)' }}>
          <h1 className="text-white text-2xl font-bold">ZK.</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewTab('feed');
                setTab('following');
              }}
              className={`px-3 py-2 rounded-full text-xs font-semibold transition ${
                viewTab === 'feed' && tab === 'following'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              フォロー中
            </button>
            <button
              onClick={() => {
                setViewTab('feed');
                setTab('all');
              }}
              className={`px-3 py-2 rounded-full text-xs font-semibold transition ${
                viewTab === 'feed' && tab === 'all'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setViewTab('map')}
              className={`px-3 py-2 rounded-full text-xs font-semibold transition ${
                viewTab === 'map'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🗺️ マップ
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 pb-4 space-y-4" style={{ paddingTop: 'calc(5rem + var(--safe-area-top))' }}>
        {viewTab === 'feed' ? (
          loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <p className="text-white">読み込み中...</p>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
              <p className="text-white text-lg">投稿がありません</p>
              <button
                onClick={() => router.push('/post')}
                className="px-6 py-2 bg-green-700 text-white rounded-full"
              >
                投稿を作成
              </button>
            </div>
          ) : (
            allPosts.map((post) => (
              <div
                key={post.id}
                className={`bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-500 transition ${
                  post.rejectedAt ? 'opacity-60 bg-red-950/30' : ''
                }`}
              >
                <div className="relative w-full aspect-square overflow-hidden bg-black">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                    onClick={() => setSelectedImageUrl(post.imageUrl)}
                  />

                  <div className="absolute top-3 left-3">
                    {post.isApproved ? (
                      <div className="bg-green-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-green-400">
                        ✅ OK
                      </div>
                    ) : !post.isApproved && (isVotingClosed(post.postedAt) || (post.totalVotes !== undefined && post.totalVotes >= 10)) ? (
                      // 投票終了後は、OKがNGより多ければ承認、そうでなければ却下
                      post.approveCount !== undefined && post.rejectCount !== undefined && post.approveCount > post.rejectCount ? (
                        <div className="bg-green-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-green-400">
                          ✅
                        </div>
                      ) : (
                        <div className="bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-red-400">
                          ❌
                        </div>
                      )
                    ) : !post.isApproved ? (
                      <div className="bg-blue-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-blue-400">
                        🔄
                      </div>
                    ) : null}
                  </div>

                  {post.questId && post.quest && (
                    <div className="absolute top-3 right-3 bg-purple-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-purple-300 shadow-lg shadow-purple-700/40 max-w-xs truncate">
                      ✨ {post.quest.title}
                    </div>
                  )}

                  {(post.isApproved || isVotingClosed(post.postedAt) || (post.totalVotes !== undefined && post.totalVotes >= 5)) && (
                    <div className="absolute bottom-3 left-3">
                      {post.totalVotes !== undefined && post.approveCount !== undefined && post.approveCount === post.totalVotes && post.totalVotes > 0 ? (
                        <div className="bg-yellow-500/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-yellow-300 shadow-lg shadow-yellow-500/40">
                          🏅 パーフェクト!
                        </div>
                      ) : (
                        <div className="bg-gray-900/80 text-white px-3 py-1 rounded-full text-sm font-semibold border border-gray-600">
                          ✅ {post.approveCount} / ❌ {post.rejectCount}
                        </div>
                      )}
                    </div>
                  )}

                  {!post.isApproved && !isVotingClosed(post.postedAt) && (post.totalVotes === undefined || post.totalVotes < 5) && post.userId !== currentUserId && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => handleVote(post.id, 'approve')}
                        disabled={post.hasVoted}
                        className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition ${
                          post.hasVoted
                            ? 'bg-gray-600 text-gray-300 shadow-gray-700/40 cursor-not-allowed opacity-60'
                            : 'bg-green-600 text-white hover:bg-green-500 shadow-green-700/40'
                        }`}
                      >
                        {post.questId ? 'OK' : '松本関連'}
                      </button>
                      <button
                        onClick={() => handleVote(post.id, 'reject')}
                        disabled={post.hasVoted}
                        className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg transition ${
                          post.hasVoted
                            ? 'bg-gray-600 text-gray-300 shadow-gray-700/40 cursor-not-allowed opacity-60'
                            : 'bg-red-600 text-white hover:bg-red-500 shadow-red-700/40'
                        }`}
                      >
                        {post.questId ? 'NG' : '関連なし'}
                      </button>
                    </div>
                  )}
                </div>

                {!post.isApproved && !isVotingClosed(post.postedAt) && post.totalVotes !== undefined && post.totalVotes > 0 && (
                  <div className="px-4 pt-3 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">投票割合:</span>
                        <span className="text-xs font-semibold text-green-400">✓ {post.approveCount}</span>
                        <span className="text-xs font-semibold text-red-400">✗ {post.rejectCount}</span>
                        {post.hasVoted && <span className="text-xs font-bold text-yellow-400">✓ 投票済み</span>}
                      </div>
                      <span className="text-xs font-bold text-green-400">{getTimeRemaining(post.postedAt)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-green-400"
                        style={{
                          width: `${(post.approveCount! / post.totalVotes!) * 100}%`
                        }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-400"
                        style={{
                          width: `${(post.rejectCount! / post.totalVotes!) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">
                      {new Date(post.postedAt).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {post.rejectedAt && (
                      <span className="text-xs bg-red-600/40 text-red-300 px-2 py-1 rounded">却下</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 border border-gray-600 hover:border-green-500 transition cursor-pointer"
                        onClick={() => router.push(`/user/${post.user.id}`)}
                      >
                        {post.user.avatarUrl ? (
                          <img
                            src={post.user.avatarUrl}
                            alt={post.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-300">
                            {post.user.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div>
                        <p
                          className="font-bold text-white cursor-pointer hover:text-green-400 transition"
                          onClick={() => router.push(`/user/${post.user.id}`)}
                        >
                          {post.user.displayName || post.user.username}
                        </p>
                        <p className="text-sm text-gray-400">@{post.user.username}</p>
                        <p className="text-xs text-gray-500">{new Date(post.postedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-400">投票数</p>
                      <p className="text-lg font-bold text-white">{post.totalVotes ?? 0}</p>
                      {isVotingClosed(post.postedAt) && post.totalVotes !== undefined && post.totalVotes > 0 && (
                        <p className="text-xs text-gray-500 mt-1">✓ {post.approveCount} / ✗ {post.rejectCount}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{post.caption}</p>

                  {post.tags && (
                    <div className="flex flex-wrap gap-2 text-xs text-green-300">
                      {post.tags.split(',').map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-green-900/50 border border-green-700 rounded-full"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold border transition ${
                        post.hasLiked
                          ? 'bg-pink-600 text-white border-pink-500'
                          : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      ❤️ {post.likeCount ?? 0}
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600"
                    >
                      💬 {post.commentCount ?? 0}
                    </button>
                  </div>

                  {expandedPostId === post.id && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-3">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {loadingComments[post.id] ? (
                          <p className="text-gray-400 text-sm">読み込み中...</p>
                        ) : comments[post.id] && comments[post.id].length > 0 ? (
                          comments[post.id].map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2">
                              <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 border border-gray-600">
                                {comment.user.avatarUrl ? (
                                  <img
                                    src={comment.user.avatarUrl}
                                    alt={comment.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-gray-300">
                                    {comment.user.username[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-white font-semibold">
                                  {comment.user.displayName || comment.user.username}
                                </p>
                                <p className="text-xs text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                                <p className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                削除
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">コメントはまだありません</p>
                        )}
                      </div>

                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const input = form.elements.namedItem('comment') as HTMLInputElement;
                          const text = input.value.trim();
                          if (!text) return;
                          handleComment(post.id, text);
                          input.value = '';
                        }}
                      >
                        <input
                          name="comment"
                          type="text"
                          placeholder="コメントを入力..."
                          className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-green-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-500"
                        >
                          送信
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          <>
            {mapLoading ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <p className="text-white">マップを読み込み中...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mapPosts.length === 0 && (
                  <p className="text-center text-sm text-gray-400">
                    位置情報付きの承認済み投稿がまだありません
                  </p>
                )}
                <FeedMap key="map-feed" posts={mapPosts} />
              </div>
            )}
          </>
        )}
      </div>

      {/* 画像拡大表示モーダル */}
      {selectedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg transition"
            >
              ✕
            </button>
            <img
              src={selectedImageUrl}
              alt="拡大表示"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
