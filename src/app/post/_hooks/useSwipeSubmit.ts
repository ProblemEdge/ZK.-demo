import { useState } from 'react';

/**
 * スワイプで投稿機能を管理するカスタムフック
 */
export const useSwipeSubmit = () => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const handleSwipeStart = (clientY: number, isSending: boolean) => {
    if (isSending) return;
    setIsSwiping(true);
    setSwipeStartY(clientY);
    setSwipeProgress(0);
  };

  const handleSwipeMove = (clientY: number) => {
    if (!isSwiping) return;
    const delta = swipeStartY - clientY;
    const maxDistance = 240;
    const progress = Math.max(0, Math.min(delta / maxDistance, 1));
    setSwipeProgress(progress);
  };

  const handleSwipeEnd = (onComplete: () => void) => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (swipeProgress >= 1) {
      onComplete();
    } else {
      setSwipeProgress(0);
    }
  };

  return {
    isSwiping,
    swipeProgress,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    setIsSwiping,
    setSwipeProgress,
  };
};
