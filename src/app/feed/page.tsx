'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import FeedCard from '../components/FeedCard';
import FeedHeader from '../components/FeedHeader';
import type { PostStatus } from '../components/PostStatusTag';
import { useReward } from '../context/RewardContext';
import { useAuth } from '../context/AuthContext';
import type { MapPost } from '../components/FeedMap';

const FeedMap = dynamic(() => import('../components/FeedMap'), { ssr: false });

// --- 型定義 ---
interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Quest {
  id: string;
  title: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: User;
}

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  title?: string;
  caption: string;
  tags: string;
  postedAt: string;
  isApproved: boolean;
  rejectedAt: string | null;
  questId?: string | null;
  quest?: Quest | null;
  user: User;
  approveCount?: number;
  rejectCount?: number;
  totalVotes?: number;
  likeCount?: number;
  commentCount?: number;
  hasLiked?: boolean;
  hasVoted?: boolean;
}

interface FeedResponse {
  voting: Post[];
  approved: Post[];
}

// --- ユーティリティ関数 ---
const isVotingClosed = (postedAt: string) => {
  const postDate = new Date(postedAt);
  const now = new Date();
  return now.getTime() - postDate.getTime() > 5 * 60 * 1000; // 5分
};

const getTimeRemaining = (postedAt: string) => {
  const postDate = new Date(postedAt);
  const expiryDate = new Date(postDate.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  if (diff <= 0) return '投票終了';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `残り ${hours}時間${mins}分`;
};

// --- メインコンポーネント ---
export default function FeedPage() {
  const router = useRouter();
  const { status, user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  // ステート管理
  const [tab, setTab] = useState<'all' | 'following'>('all');
  const [viewTab, setViewTab] = useState<'feed' | 'map'>('feed');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [mapPosts, setMapPosts] = useState<MapPost[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  const { showReward } = useReward();

  // 定期的な処理
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    fetchPosts();
    checkRewards();

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      processExpiredVotes();
    }, 300000); // 5分ごと
    
    return () => clearInterval(interval);
  }, [tab, status]);

  const processExpiredVotes = async () => {
    try {
      await fetch('/api/votes/process-expired', { credentials: 'include' });
    } catch (err) {
      console.error('Error processing expired votes:', err);
    }
  };

  const checkRewards = async () => {
    try {
      const lastChecked = Number(localStorage.getItem('last_reward_check') || '0');
      if (Date.now() - lastChecked < 60000) return;
      localStorage.setItem('last_reward_check', Date.now().toString());

      const res = await fetch('/api/notifications/check-rewards', { credentials: 'include' });
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
      if (status !== 'authenticated') return;
      setLoading(true);
      const res = await fetch(`/api/feed?tab=${tab}`, {
        cache: 'no-store',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('投稿の取得に失敗しました');

      const data: FeedResponse = await res.json();
      setAllPosts([...data.voting, ...data.approved]);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string, type: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include'
      });

      if (res.ok) {
        // ローカルステートを更新してUIに即時反映
        setAllPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const approveAdd = type === 'approve' ? 1 : 0;
            const rejectAdd = type === 'reject' ? 1 : 0;
            return {
              ...p,
              hasVoted: true,
              approveCount: (p.approveCount || 0) + approveAdd,
              rejectCount: (p.rejectCount || 0) + rejectAdd,
              totalVotes: (p.totalVotes || 0) + 1
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const handleLike = async (postId: string) => {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const wasLiked = post.hasLiked;

    try {
      const method = wasLiked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/posts/${postId}/likes`, { method, credentials: 'include' });

      if (res.ok) {
        setAllPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, hasLiked: !wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? -1 : 1) }
            : p
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = useCallback((postId: string) => {
    setExpandedPostId(prevId => {
      if (prevId === postId) return null;
      if (!comments[postId]) fetchComments(postId);
      return postId;
    });
  }, [comments]);

  const handleComment = async (postId: string, text: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include'
      });

      if (res.ok) {
        setAllPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
        ));
        await fetchComments(postId);
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('コメントを削除しますか？')) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c.id !== commentId)
        }));
        setAllPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p
        ));
      }
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="fixed left-0 right-0 top-0 z-40" style={{ paddingTop: 'var(--safe-area-top)' }}>
        <FeedHeader 
          tab={tab}
          viewTab={viewTab}
          onTabChange={setTab}
          onViewTabChange={setViewTab}
        />
      </div>

      <div className="px-4 pb-4 space-y-4" style={{ paddingTop: 'calc(5rem + var(--safe-area-top))' }}>
        {viewTab === 'feed' ? (
          loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <p className="text-white">読み込み中...</p>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
              <p className="text-white text-lg">投稿がありません</p>
              <button onClick={() => router.push('/post')} className="px-6 py-2 bg-green-700 text-white rounded-full">
                投稿を作成
              </button>
            </div>
          ) : (
            allPosts.map((post) => {
              const votingClosed = isVotingClosed(post.postedAt);
              const isOwnPost = post.userId === currentUserId;
              const isVotingOpen = !votingClosed && !post.isApproved && !post.rejectedAt;
              const isVotingActive = isVotingOpen && !isOwnPost && !post.hasVoted;
              
              // postStatusの計算
              let postStatus: PostStatus;
              if (post.isApproved) {
                postStatus = 'approved';
              } else if (post.rejectedAt) {
                postStatus = 'rejected';
              } else if (votingClosed) {
                // 投票終了時に承認率で判定
                const total = (post.approveCount || 0) + (post.rejectCount || 0);
                if (total > 0) {
                  const approveRate = (post.approveCount || 0) / total;
                  postStatus = approveRate >= 0.5 ? 'approved' : 'rejected';
                } else {
                  postStatus = 'rejected';
                }
              } else {
                postStatus = 'voting';
              }
              
              // voteStatusTypeの計算
              let voteStatusType: 'question' | 'ultimate' | 'perfect' | 'success' = 'question';
              if (post.isApproved) {
                voteStatusType = 'success';
              } else if (votingClosed || post.rejectedAt) {
                // 投票終了または却下された場合は必ずsuccess以上を表示（questionは表示しない）
                if (post.totalVotes !== undefined && post.totalVotes > 0 && post.approveCount !== undefined) {
                  if (post.approveCount === post.totalVotes && post.totalVotes >= 10) {
                    voteStatusType = 'ultimate';
                  } else if (post.approveCount === post.totalVotes && post.totalVotes > 0) {
                    voteStatusType = 'perfect';
                  } else {
                    voteStatusType = 'success';
                  }
                } else {
                  voteStatusType = 'success';
                }
              } else if (isOwnPost || post.hasVoted) {
                // 自分の投稿または投票済みで投票期間中の場合は常にsuccess（投票状況を表示）
                voteStatusType = 'success';
              }

              // 投票中で未投票の場合はタイトルを非表示
              const shouldHideTitle = isVotingActive;

              return (
                <FeedCard
                  key={post.id}
                  imageUrl={post.imageUrl}
                  userName={post.user.displayName || post.user.username}
                  userId={post.user.username}
                  postedAt={post.postedAt}
                  title={shouldHideTitle ? undefined : post.title}
                  tags={post.tags ? post.tags.split(',').map((t: string) => t.trim()) : []}
                  postStatus={postStatus}
                  questTag={post.quest?.title}
                  voteStatusType={voteStatusType}
                  approvedCount={post.approveCount}
                  rejectedCount={post.rejectCount}
                  isVotingOpen={isVotingOpen}
                  isVoting={isVotingActive}
                  voteCount={post.totalVotes ?? 0}
                  likeCount={post.likeCount ?? 0}
                  commentCount={post.commentCount ?? 0}
                  onLike={() => handleLike(post.id)}
                  onComment={() => handleToggleComments(post.id)}
                  onVoteOk={() => handleVote(post.id, 'approve')}
                  onVoteNg={() => handleVote(post.id, 'reject')}
                >
                  {post.caption}
                </FeedCard>
              );
            })
          )
        ) : (
          <div className="space-y-3">
            <FeedMap key="map-feed" posts={mapPosts} />
          </div>
        )}
      </div>

      {selectedImageUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImageUrl(null)}>
          <img src={selectedImageUrl} className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <BottomNav />
    </div>
  );
}