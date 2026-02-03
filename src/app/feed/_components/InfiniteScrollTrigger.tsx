interface InfiniteScrollTriggerProps {
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
}

/**
 * 無限スクロールトリガーコンポーネント
 */
export default function InfiniteScrollTrigger({ 
  loading, 
  hasMore, 
  loadingMore, 
  observerRef 
}: InfiniteScrollTriggerProps) {
  if (loading) return null;

  return (
    <>
      {hasMore && (
        <div ref={observerRef} className="py-2 text-center">
          {loadingMore && (
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#00e676]"></div>
          )}
        </div>
      )}
      
      {!hasMore && (
        <div className="py-4 text-center text-gray-400 text-sm">
          全ての投稿を表示しました
        </div>
      )}
    </>
  );
}
