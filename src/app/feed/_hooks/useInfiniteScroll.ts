import { useEffect, useRef } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  status: string;
  onLoadMore: () => void;
}

/**
 * 無限スクロールを管理するカスタムフック
 */
export const useInfiniteScroll = ({ hasMore, loading, loadingMore, status, onLoadMore }: UseInfiniteScrollProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && status === 'authenticated') {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, status, onLoadMore]);

  return { observerTarget };
};
