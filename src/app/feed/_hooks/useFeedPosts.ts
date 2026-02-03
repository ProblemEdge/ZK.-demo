import { useState, useEffect, useCallback, useRef } from 'react';
import type { Post, FeedResponse, TabType } from '../_types';

interface UseFeedPostsProps {
  tab: TabType;
  status: string;
}

/**
 * フィード投稿データの取得と管理を行うカスタムフック
 */
export const useFeedPosts = ({ tab, status }: UseFeedPostsProps) => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (status !== 'authenticated') return;
      
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const res = await fetch(`/api/feed?tab=${tab}&page=${pageNum}`, {
        cache: 'no-store',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('投稿の取得に失敗しました');

      const data: FeedResponse = await res.json();
      const newPosts = [...data.voting, ...data.approved];
      
      if (reset) {
        setAllPosts(newPosts);
      } else {
        setAllPosts(prev => [...prev, ...newPosts]);
      }
      
      setPage(pageNum);
      setHasMore(newPosts.length === 10);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setPage(1);
    setHasMore(true);
    setAllPosts([]);
    fetchPosts(1, true);
  }, [tab, status, fetchPosts]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchPosts(page + 1, false);
  }, [loadingMore, hasMore, page, fetchPosts]);

  return {
    allPosts,
    setAllPosts,
    loading,
    loadingMore,
    hasMore,
    loadMorePosts,
    page,
  };
};
