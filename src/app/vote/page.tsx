'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import VoteHeader from '../components/VoteHeader';
import { useReward } from '../context/RewardContext';
import { useAuth } from '../context/AuthContext';
import { createVote as createVoteAction, processExpiredVotes as processExpiredVotesAction } from '@/actions/vote';
import { 
  getPendingPosts, 
  likePost, 
  unlikePost, 
  createComment, 
  getComments,
  deleteComment
} from '@/actions/post';

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  title?: string;
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

type VoteResponse = {
  reward?: {
    gems?: number;
    exp?: number;
    currentExp?: number;
    expToNextLevel?: number;
    level?: number;
    message?: string;
  };
  isComplete?: boolean;
};

export default function VotePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date()); // タイマー用
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const [showResult, setShowResult] = useState(false);
  const [resultCounts, setResultCounts] = useState<{ approve: number; reject: number } | null>(null);
  const [resultMeta, setResultMeta] = useState<{ title: string; subtitle: string } | null>(null);
  const [resultAnimationPhase, setResultAnimationPhase] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const resultTimeoutRef = useRef<number | null>(null);
  const votedPostIdsRef = useRef<Set<string>>(new Set());
  const votedPostTimeoutRef = useRef<number | null>(null);
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetchPendingPosts();
    // 1秒ごとに時刻を更新してタイマーを動作させる
    const timerInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      setCurrentUserId(user?.id ?? null);
    }
  }, [status, user?.id, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    // 1分ごとに最新の投稿を再取得
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchPendingPosts();
    }, 60000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    // 5分ごとに期限切れの投票を処理
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      processExpiredVotes();
    }, 300000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current !== null) {
        window.clearTimeout(resultTimeoutRef.current);
      }
      if (votedPostTimeoutRef.current !== null) {
        window.clearTimeout(votedPostTimeoutRef.current);
      }
    };
  }, []);

  const processExpiredVotes = async () => {
    try {
      await processExpiredVotesAction();
    } catch (err) {
      console.error('Error processing expired votes:', err);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const data = await getPendingPosts();
      const filtered = (data as Post[]).filter((p: Post) => !votedPostIdsRef.current.has(p.id));
      setPosts(filtered);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const { showReward } = useReward();

  const handleVote = async (postId: string, voteType: 'approve' | 'reject') => {
    // アニメーション表示中は投票を受け付けない
    if (showResult) return;

    try {
      const votedPost = posts.find(p => p.id === postId);
      if (votedPost) {
        const approve = votedPost.approveCount + (voteType === 'approve' ? 1 : 0);
        const reject = votedPost.rejectCount + (voteType === 'reject' ? 1 : 0);
        setResultCounts({ approve, reject });
        setResultMeta({
          title: votedPost.questId ? (votedPost.quest?.title || 'これは松本？') : 'これは松本？',
          subtitle: votedPost.questId ? (votedPost.quest?.description || '') : '松本に関係あると思う？'
        });
        setShowResult(true);
        setResultAnimationPhase(0);
        
        if (resultTimeoutRef.current !== null) {
          window.clearTimeout(resultTimeoutRef.current);
        }

        // アニメーション：第1段階（バーアニメーション）
        resultTimeoutRef.current = window.setTimeout(() => {
          setResultAnimationPhase(1);
        }, 200);

        // アニメーション：第2段階（比率表示）
        resultTimeoutRef.current = window.setTimeout(() => {
          setResultAnimationPhase(2);
        }, 600);

        // アニメーション：終了
        resultTimeoutRef.current = window.setTimeout(() => {
          setShowResult(false);
          setResultCounts(null);
          setResultMeta(null);
          setResultAnimationPhase(0);
        }, 1500);
      }

      // 投票済みIDを記録（すぐに再表示されないようにする）
      votedPostIdsRef.current.add(postId);

      // 30秒後にキャッシュをクリア（バックエンドの同期完了を想定）
      if (votedPostTimeoutRef.current !== null) {
        window.clearTimeout(votedPostTimeoutRef.current);
      }
      votedPostTimeoutRef.current = window.setTimeout(() => {
        votedPostIdsRef.current.delete(postId);
      }, 30000);

      const data = await createVoteAction(postId, voteType) as VoteResponse | null;

      // 報酬通知を表示
      if (data?.reward) {
        showReward({
          ...data.reward,
          message: '投票に参加しました！'
        });
      }

      // 投票した投稿を一覧から削除（同じ投稿が表示されないように）
      setPosts(prev => prev.filter(p => p.id !== postId));

      if (!data?.isComplete) {
        await fetchPendingPosts();
      }

    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const handleSkip = (postId: string) => {
    // アニメーション表示中はスキップを受け付けない
    if (showResult) return;
    
    setPosts(prev => prev.filter(p => p.id !== postId));
    setDragX(0);
    setIsDragging(false);
  };

  const handleDragStart = (clientX: number) => {
    // アニメーション表示中はドラッグを受け付けない
    if (showResult) return;
    
    setIsDragging(true);
    dragStartXRef.current = clientX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - dragStartXRef.current;
    setDragX(delta);
  };

  const handleDragEnd = (postId: string) => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 120;
    if (dragX <= -threshold) {
      void handleVote(postId, 'approve');
    } else if (dragX >= threshold) {
      void handleVote(postId, 'reject');
    }
    setDragX(0);
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
        await unlikePost(postId);

        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, hasLiked: false, likeCount: (p.likeCount || 0) - 1 }
            : p
        ));
      } else {
        await likePost(postId);

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
      await createComment(postId, text);

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
      const data = await getComments(postId);
      setComments({ ...comments, [postId]: data as Comment[] });
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('コメントを削除しますか？')) return;

    try {
      await deleteComment(postId, commentId);

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

  const votablePosts = posts.filter(
    p => !isVotingClosed(p.postedAt) && !p.hasVoted && p.userId !== currentUserId
  );
  const currentPost = votablePosts[0];
  
  // スワイプ方向に応じてボタンサイズを計算
  // 左方向（承認側）：承認ボタン大きく、否定ボタン小さく
  // 右方向（否定側）：否定ボタン大きく、承認ボタン小さく
  const approveScale = dragX < 0 
    ? 1 + Math.min(Math.max(-dragX / 200, 0), 1) * 0.35
    : Math.max(0.65, 1 - (dragX / 200) * 0.35);
  const rejectScale = dragX > 0 
    ? 1 + Math.min(Math.max(dragX / 200, 0), 1) * 0.35
    : Math.max(0.65, 1 - (-dragX / 200) * 0.35);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c0f] to-[#0f0f0f]" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="fixed left-0 right-0 top-0 z-40" style={{ paddingTop: 'var(--safe-area-top)' }}>
        <VoteHeader />
      </div>

      <div className="relative" style={{ paddingTop: 'calc(6rem + var(--safe-area-top))' }}>
        <div className="relative z-10 px-4 pb-24 max-w-2xl mx-auto">
          {loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <p className="text-white">読み込み中...</p>
            </div>
          ) : showResult && resultCounts && resultMeta ? (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}>
              {/* 背景分割（割合で色分け） */}
              <div className="absolute inset-0 flex overflow-hidden">
                <div 
                  className="transition-all duration-500"
                  style={{
                    width: `${(resultCounts.approve / (resultCounts.approve + resultCounts.reject)) * 100}%`,
                    backgroundColor: '#00e676'
                  }}
                />
                <div 
                  className="flex-1 transition-all duration-500"
                  style={{
                    backgroundColor: '#FF1744'
                  }}
                />
              </div>

              {/* コンテンツ */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                <p className="text-white text-[24px] font-bold mb-4">{resultMeta.title}</p>
                <p className="text-white text-[14px] font-bold mb-8">{resultMeta.subtitle}</p>
                
                {/* 比率表示 */}
                <div className={`transition-all duration-300 ${
                  resultAnimationPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-[88px] font-bold leading-none text-white drop-shadow-lg">
                      {resultCounts.approve}
                    </div>
                    <div className="text-[64px] font-bold leading-none text-white drop-shadow-lg">
                      -
                    </div>
                    <div className="text-[88px] font-bold leading-none text-white drop-shadow-lg">
                      {resultCounts.reject}
                    </div>
                  </div>
                </div>

                {/* チェックマーク */}
                {resultAnimationPhase >= 2 && (
                  <div className="mt-12 flex justify-center animate-pulse">
                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : !currentPost ? (
            <div className="text-center py-16">
              <p className="text-white text-[28px] font-bold">投票できる投稿がないよ</p>
              {error && (
                <div className="bg-red-900/80 text-red-200 p-3 rounded-lg mt-4 border border-red-700">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-center mt-0">
                <p className="text-white text-[22px] font-bold">{currentPost.questId ? (currentPost.quest?.title || 'これは松本？') : 'これは松本？'}</p>
                <p className="text-[#00ad59] text-[16px] font-bold mt-1">
                  {currentPost.questId ? (currentPost.quest?.description || '') : '松本に関係あると思う？'}
                </p>
              </div>

              <div
                className="mt-3 w-full max-w-[280px]"
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                onTouchEnd={() => handleDragEnd(currentPost.id)}
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onMouseMove={(e) => handleDragMove(e.clientX)}
                onMouseUp={() => handleDragEnd(currentPost.id)}
                onMouseLeave={() => handleDragEnd(currentPost.id)}
              >
                <div
                  className="rounded-[20px] overflow-hidden border-4 border-white bg-[#14161a]"
                  style={{ transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform 200ms ease' }}
                >
                  <div className="h-[240px] w-full overflow-hidden rounded-t-[16px] cursor-pointer" onClick={() => setIsImageExpanded(true)}>
                    <img src={`/api/posts/${currentPost.id}/image`} alt={currentPost.caption} className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-[#1a1d22] border-t-4 border-white px-3 py-2">
                    <p className="text-white text-[18px] font-bold text-center">{currentPost.title || ''}</p>
                    <p className="text-white text-[10px] text-center whitespace-pre-wrap mt-1">
                      {currentPost.caption || ''}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentPost.tags?.split(',').filter(Boolean).map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-[#4144ff] bg-[#87b4ff]"
                        >
                          <img src="/icon/hashtag.svg" alt="#" className="w-2 h-2" />
                          <span className="text-[#4144ff] text-[8px] font-semibold">{tag.trim()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#ff73c7] bg-[#ffcffc]">
                        <span className="text-white text-xs">❤</span>
                        <span className="text-[#ff73c7] text-[10px] font-bold">{currentPost.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#868686] bg-white">
                        <img src="/icon/Message square.svg" alt="コメント" className="w-3 h-3" />
                        <span className="text-[#868686] text-[10px] font-bold">{currentPost.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!showResult && (
              <div className="fixed left-0 right-0 bottom-0 pb-20">
                <div className="relative mx-auto max-w-2xl">
                  <button
                    type="button"
                    onClick={() => handleVote(currentPost.id, 'approve')}
                    className="absolute -left-10 -bottom-4 w-[192px] h-[192px] flex items-center justify-center bg-transparent transition-transform"
                    style={{ transform: `scale(${approveScale})` }}
                  >
                    <img src="/icon/allow_button.svg" alt="承認" className="w-20 h-20" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(currentPost.id, 'reject')}
                    className="absolute -right-10 -bottom-4 w-[192px] h-[192px] flex items-center justify-center bg-transparent transition-transform"
                    style={{ transform: `scale(${rejectScale})` }}
                  >
                    <img src="/icon/no_allow_button.svg" alt="拒否" className="w-20 h-20" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkip(currentPost.id)}
                    className="absolute left-1/2 -translate-x-1/2 bottom-14 px-6 py-2 rounded-full border-2 border-white text-white font-bold bg-black/40"
                  >
                    スキップ
                  </button>
                </div>
              </div>
              )}
            </div>
          )}
        </div>

        {/* 画像拡大モーダル */}
        {isImageExpanded && currentPost && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsImageExpanded(false)}
            style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
          >
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={`/api/posts/${currentPost.id}/image`}
                alt="投稿画像（拡大）"
                className="max-w-full max-h-[90vh] object-contain"
              />
              <button
                onClick={() => setIsImageExpanded(false)}
                className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}