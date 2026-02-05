import React, { useRef, useEffect } from 'react';
import type { Comment, User } from '../_types';

interface CommentModalProps {
  isOpen: boolean;
  postId: string;
  currentUser: User | null;
  comments: Comment[];
  loading: boolean;
  commentText: string;
  currentUserId?: string;
  onClose: () => void;
  onCommentTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteComment?: (commentId: string) => void;
  onLoadMore?: () => Promise<boolean>;
  hasMore?: boolean;
}

/**
 * コメントモーダルコンポーネント
 */
export default function CommentModal({
  isOpen,
  postId,
  currentUser,
  comments,
  loading,
  commentText,
  currentUserId,
  onClose,
  onCommentTextChange,
  onSubmit,
  onDeleteComment,
  onLoadMore,
  hasMore,
}: CommentModalProps) {
  if (!isOpen) return null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevCommentsLengthRef = useRef<number>(comments.length);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // 初回オープン時は下にスクロールして最新を表示
    el.scrollTop = el.scrollHeight;
    prevScrollHeightRef.current = el.scrollHeight;
    prevCommentsLengthRef.current = comments.length;
  }, [isOpen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevLen = prevCommentsLengthRef.current;
    const newLen = comments.length;
    const newScrollHeight = el.scrollHeight;
    // コメントが prepend（上に追加）された場合、スクロール位置を維持する
    if (newLen > prevLen) {
      const added = newLen - prevLen;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      if (diff > 0) {
        el.scrollTop = el.scrollTop + diff;
      }
    }
    prevCommentsLengthRef.current = newLen;
    prevScrollHeightRef.current = newScrollHeight;
  }, [comments]);

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 60 && hasMore && onLoadMore && !loading) {
      const prevHeight = el.scrollHeight;
      await onLoadMore();
      // loadMore により prepend されたら、scroll position は useEffect で調整されます
    }
  };
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
      style={{ touchAction: 'none' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[393px] bg-[#14161A] border border-white rounded-t-[16px] px-4 pt-4 pb-4 flex flex-col h-[80vh] max-h-[80vh]"
        style={{ paddingBottom: 'calc(1rem + var(--safe-area-bottom))' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-1">
          <p className="text-white text-[24px] font-bold">コメント</p>
          <svg width="140" height="18" viewBox="0 0 140 18" fill="none" aria-hidden>
            <path d="M6 4L70 14L134 4" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <div ref={containerRef} onScroll={handleScroll} className="mt-4 space-y-3 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-white/70 text-sm text-center">読み込み中...</p>
          ) : comments.length === 0 ? (
            <p className="text-white/70 text-sm text-center">最初のコメントを投稿しよう</p>
          ) : (
            comments.map((comment) => {
              const isOwn = comment.user.id === currentUserId;
              return (
                <div key={comment.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2a2d33] border border-white/40 flex items-center justify-center">
                      {comment.user.avatarUrl ? (
                        <img src={comment.user.avatarUrl} alt={comment.user.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[10px] font-bold">?</span>
                      )}
                    </div>
                    <div className="max-w-[70%]">
                      <div className={`text-[10px] text-white/70 mb-1 ${isOwn ? 'text-right' : ''}`}>
                        @{comment.user.username}
                      </div>
                      <div className="bg-[#1a1d22] border border-white/30 rounded-[12px] px-3 py-2 text-white text-[13px] whitespace-pre-wrap">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form className="mt-4 border-t border-white/20 pt-3" onSubmit={onSubmit}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a2d33] border border-white/40 flex items-center justify-center">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">?</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-white text-[11px]">@{currentUser?.username || 'you'}</div>
              <div className="mt-0.5 h-px w-[57px] bg-[#d9d9d9]" />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(event) => onCommentTextChange(event.target.value)}
                  placeholder="コメントを書く"
                  className="flex-1 h-[42px] bg-[#14161A] border border-white rounded-[8px] px-3 text-white text-[14px] placeholder:text-white/40"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="h-[42px] px-4 rounded-[8px] border border-white text-white text-[12px] font-bold disabled:opacity-40"
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
