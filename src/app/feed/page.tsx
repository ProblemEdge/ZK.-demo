'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import FeedCard from '../components/FeedCard';
import FeedHeader from '../components/FeedHeader';
import type { PostStatus } from '../components/PostStatusTag';
import { useAuth } from '../context/AuthContext';
import type { MapPost } from '../components/FeedMap';

// 型とヘルパーのインポート
import type { TabType, ViewTabType } from './_types';
import { isVotingClosed } from './_helpers';

// カスタムフックのインポート
import { useFeedPosts } from './_hooks/useFeedPosts';
import { useComments } from './_hooks/useComments';
import { useVotes } from './_hooks/useVotes';
import { useLikes } from './_hooks/useLikes';
import { useInfiniteScroll } from './_hooks/useInfiniteScroll';
import { useRewardCheck } from './_hooks/useRewardCheck';

// コンポーネントのインポート
import CommentModal from './_components/CommentModal';
import ImagePreviewModal from './_components/ImagePreviewModal';
import InfiniteScrollTrigger from './_components/InfiniteScrollTrigger';
import EmptyState from './_components/EmptyState';

const FeedMap = dynamic(() => import('../components/FeedMap'), { ssr: false });

// --- メインコンポーネント ---
export default function FeedPage() {
  const router = useRouter();
  const { status, user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  // ステート管理
  const [tab, setTab] = useState<TabType>('all');
  const [viewTab, setViewTab] = useState<ViewTabType>('feed');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [mapPosts, setMapPosts] = useState<MapPost[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // カスタムフックの使用
  const { allPosts, setAllPosts, loading, loadingMore, hasMore, loadMorePosts } = useFeedPosts({ tab, status });
  const { 
    expandedPostId, 
    setExpandedPostId, 
    comments, 
    loadingComments, 
    commentText, 
    setCommentText,
    handleToggleComments,
    handleComment,
    handleDeleteComment,
    fetchComments,
    loadMoreComments,
    commentsMeta,
  } = useComments();
  const { handleVote, processExpiredVotes } = useVotes();
  const { handleLike } = useLikes();
  const { observerTarget } = useInfiniteScroll({ 
    hasMore, 
    loading, 
    loadingMore, 
    status, 
    onLoadMore: loadMorePosts 
  });
  useRewardCheck(status);

  useRewardCheck(status);

  // コメントテキストのリセット
  useEffect(() => {
    setCommentText('');
  }, [expandedPostId, setCommentText]);

  // ピンチズーム防止
  useEffect(() => {
    if (!expandedPostId) return;

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, [expandedPostId]);

  // 定期的な投票処理
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      processExpiredVotes();
    }, 300000); // 5分ごと
    
    return () => clearInterval(interval);
  }, [status, processExpiredVotes]);

  // コメント送信ハンドラー
  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!expandedPostId) return;
    const text = commentText.trim();
    if (!text) return;
    
    const success = await handleComment(expandedPostId, text);
    if (success) {
      setAllPosts(prev => prev.map(p => 
        p.id === expandedPostId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
      ));
      setCommentText('');
    }
  };

  // コメント削除ハンドラー
  const handleDeleteCommentWrapper = async (commentId: string) => {
    if (!expandedPostId) return;
    const success = await handleDeleteComment(expandedPostId, commentId);
    if (success) {
      setAllPosts(prev => prev.map(p => 
        p.id === expandedPostId ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : p
      ));
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
            <EmptyState onCreatePost={() => router.push('/post')} />
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
                voteStatusType = 'success';
              }

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
                  hasLiked={post.hasLiked ?? false}
                  commentCount={post.commentCount ?? 0}
                  onLike={() => handleLike(post.id, allPosts, setAllPosts)}
                  onComment={() => handleToggleComments(post.id)}
                  onVoteOk={() => handleVote(post.id, 'approve', setAllPosts)}
                  onVoteNg={() => handleVote(post.id, 'reject', setAllPosts)}
                  onDelete={async () => {
                    if (!confirm('この投稿を削除してもよろしいですか？')) return;
                    try {
                      await (await import('@/actions/post')).deletePost(post.id);
                      // 全投稿リストから削除
                      setAllPosts(prev => prev.filter(p => p.id !== post.id));
                    } catch (err) {
                      console.error('投稿削除エラー:', err);
                      alert('削除に失敗しました');
                    }
                  }}
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
        
        {viewTab === 'feed' && (
          <InfiniteScrollTrigger 
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            observerRef={observerTarget}
          />
        )}
      </div>

      <ImagePreviewModal 
        imageUrl={selectedImageUrl} 
        onClose={() => setSelectedImageUrl(null)} 
      />

      <CommentModal
        isOpen={!!expandedPostId}
        postId={expandedPostId || ''}
        currentUser={currentUser}
        comments={expandedPostId ? (comments[expandedPostId] || []) : []}
        loading={expandedPostId ? (loadingComments[expandedPostId] || false) : false}
        commentText={commentText}
        currentUserId={currentUserId}
        onClose={() => setExpandedPostId(null)}
        onCommentTextChange={setCommentText}
        onSubmit={handleSubmitComment}
        onDeleteComment={handleDeleteCommentWrapper}
        onLoadMore={async () => {
          if (!expandedPostId) return false;
          return await loadMoreComments(expandedPostId);
        }}
        hasMore={expandedPostId ? (commentsMeta[expandedPostId]?.hasMore ?? false) : false}
      />

      {!expandedPostId && <BottomNav />}
    </div>
  );
}
