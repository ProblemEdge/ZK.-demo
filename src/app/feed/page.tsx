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
  isApproved: boolean;
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
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchPosts();

    // 1分ごとに期限切れの投票を処理して削除
    const interval = setInterval(() => {
      processExpiredVotes();
    }, 60000); // 60秒ごと

    return () => clearInterval(interval);
  }, [tab]);

  const processExpiredVotes = async () => {
    try {
      await fetch('/api/votes/process-expired');
    } catch (err) {
      console.error('Error processing expired votes:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
      }
    } catch {
      router.push('/login');
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
      // 承認済み投稿と投票中の投稿を合わせて、投票中を先に表示
      const combinedPosts = [...data.voting, ...data.approved];
      setAllPosts(combinedPosts);

    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // 投稿から5分以上経っているかチェック
  const isVotingClosed = (postedAt: string): boolean => {
    const postTime = new Date(postedAt).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return postTime < fiveMinutesAgo;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">読み込み中...</p>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center pb-20">
        <p className="text-white text-lg mb-4">投稿がありません</p>
        <button
          onClick={() => router.push('/post')}
          className="px-6 py-2 bg-green-700 text-white rounded-full"
        >
          投稿を作成
        </button>
        <BottomNav />
      </div>
    );
  }

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

      alert(voteType === 'approve' ? '承認に投票しました' : '却下に投票しました');
      // データを更新
      await fetchPosts();
    } catch (err) {
      console.error('Vote error:', err);
      alert('投票に失敗しました');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = allPosts.find(p => p.id === postId);
      if (!post) return;

      if (post.hasLiked) {
        // いいね削除
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          alert('いいね削除に失敗しました');
          return;
        }

        // UIを更新
        setAllPosts(allPosts.map(p =>
          p.id === postId
            ? { ...p, hasLiked: false, likeCount: (p.likeCount || 0) - 1 }
            : p
        ));
      } else {
        // いいね追加
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: 'POST'
        });

        if (!res.ok) {
          alert('いいねに失敗しました');
          return;
        }

        // UIを更新
        setAllPosts(allPosts.map(p =>
          p.id === postId
            ? { ...p, hasLiked: true, likeCount: (p.likeCount || 0) + 1 }
            : p
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
      alert('いいね処理に失敗しました');
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
        alert('コメント投稿に失敗しました');
        return;
      }

      // UIを更新
      setAllPosts(allPosts.map(p =>
        p.id === postId
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));

      // コメント一覧を再取得
      await fetchComments(postId);
    } catch (err) {
      console.error('Comment error:', err);
      alert('コメント投稿に失敗しました');
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      // コメントをまだ取得していない場合は取得
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
        alert('コメント削除に失敗しました');
        return;
      }

      // UIを更新
      setComments({
        ...comments,
        [postId]: (comments[postId] || []).filter(c => c.id !== commentId)
      });

      setAllPosts(allPosts.map(p =>
        p.id === postId
          ? { ...p, commentCount: (p.commentCount || 1) - 1 }
          : p
      ));
    } catch (err) {
      console.error('Delete comment error:', err);
      alert('コメント削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">ZK.</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTab('following');
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                tab === 'following'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              フォロー中
            </button>
            <button
              onClick={() => {
                setTab('all');
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                tab === 'all'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              すべて
            </button>
          </div>
        </div>
      </header>

      {/* フィード */}
      <div className="pt-20 space-y-4 px-4">
        {allPosts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-500 transition"
          >
            {/* 投稿画像 */}
            <div className="relative w-full aspect-square overflow-hidden bg-black">
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover"
              />
              
              {/* 左上ステータスバッジ */}
              <div className="absolute top-3 left-3">
                {post.isApproved ? (
                  <div className="bg-green-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-green-400">
                    ✅ 承認済み {post.approveCount}✅ {post.rejectCount}❌
                  </div>
                ) : (
                  <div className="bg-blue-600/90 text-white px-3 py-1 rounded-full text-sm font-bold border border-blue-400">
                    🔄 投票受付中
                  </div>
                )}
              </div>
            </div>

            {/* 投稿者情報 */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                  {post.user.avatarUrl ? (
                    <img
                      src={post.user.avatarUrl}
                      alt={post.user.username}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                      onClick={() => router.push(`/user/${post.userId}`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg font-bold cursor-pointer hover:opacity-80 transition"
                      onClick={() => router.push(`/user/${post.userId}`)}
                    >
                      {post.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-white cursor-pointer hover:text-green-400 transition" onClick={() => router.push(`/user/${post.userId}`)}>
                    {post.user.displayName || post.user.username}
                  </p>
                  <p className="text-xs text-gray-400">@{post.user.username}</p>
                </div>
              </div>

              {/* キャプション */}
              <p className="text-gray-100 mb-2">{post.caption}</p>

              {/* タグ */}
              {post.tags && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.split(',').map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-semibold border border-green-400"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 投票情報（投票中の投稿のみ） */}
            {!post.isApproved && post.totalVotes !== undefined && (
              <div className="p-4 bg-gray-700/50 border-t border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-white">
                    投票: {post.totalVotes}/5
                  </span>
                </div>

                {post.totalVotes > 0 ? (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-semibold text-green-400">✅ {post.approveCount}票 / ❌ {post.rejectCount}票</span>
                      <span className="text-xs text-gray-300 font-medium">{Math.round((post.approveCount! / post.totalVotes) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-6 overflow-hidden border border-gray-500 flex">
                      <div
                        className="bg-green-600 h-full transition-all shadow-lg shadow-green-600/50"
                        style={{ width: `${Math.round((post.approveCount! / post.totalVotes) * 100)}%` }}
                      />
                      <div
                        className="bg-red-600 h-full transition-all shadow-lg shadow-red-600/50"
                        style={{ width: `${100 - Math.round((post.approveCount! / post.totalVotes) * 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-xs text-gray-400 py-2 font-medium">
                    投票なし
                  </div>
                )}
              </div>
            )}

            {/* 投票ボタン（投票中で期限内の場合） */}
            {!post.isApproved && !isVotingClosed(post.postedAt) && post.totalVotes !== undefined && post.totalVotes < 5 && (
              <div className="p-4 border-t border-gray-700 flex gap-3">
                <button
                  onClick={() => handleVote(post.id, 'approve')}
                  disabled={post.hasVoted}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition border ${
                    post.hasVoted
                      ? 'bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-lg shadow-green-600/30'
                  }`}
                >
                  ✅ 松本関連
                </button>
                <button
                  onClick={() => handleVote(post.id, 'reject')}
                  disabled={post.hasVoted}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition border ${
                    post.hasVoted
                      ? 'bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-lg shadow-red-600/30'
                  }`}
                >
                  ❌ 関連なし
                </button>
              </div>
            )}

            {/* 承認済みまたは投票終了のメッセージ */}
            {post.isApproved && (
              <div className="p-4 border-t border-gray-700 text-center text-sm text-green-400 font-semibold bg-gray-700/30">
                ✅ 承認済み
              </div>
            )}

            {!post.isApproved && isVotingClosed(post.postedAt) && (
              <div className="p-4 border-t border-gray-700 text-center text-sm text-gray-400 font-semibold bg-gray-700/30">
                投票終了
              </div>
            )}

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

      <BottomNav />
    </div>
  );
}