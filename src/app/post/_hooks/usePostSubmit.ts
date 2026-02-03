import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PostData, VisibilityScope, VisibilityDuration, LimitInfo } from '../_types';

interface UsePostSubmitProps {
  imageFile: File | null;
  title: string;
  caption: string;
  selectedTags: string[];
  visibilityScope: VisibilityScope;
  visibilityDuration: VisibilityDuration;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  isQuestMode: boolean;
  selectedQuestId: string | null;
  limitInfo: LimitInfo | null;
}

/**
 * 投稿送信を管理するカスタムフック
 */
export const usePostSubmit = (props: UsePostSubmitProps) => {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [showPlane, setShowPlane] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitDoneRef = useRef(false);
  const submitAbortRef = useRef<AbortController | null>(null);

  const redirectToLimit = (limit?: number, resetAt?: string) => {
    const limitValue = limit ?? 5;
    const resetAtParam = resetAt ? encodeURIComponent(resetAt) : '';
    router.replace(`/post/limit?limit=${limitValue}&resetAt=${resetAtParam}`);
  };

  const submitPost = async (isLimitReached: boolean) => {
    if (!props.imageFile || isSending) return;
    if (isLimitReached) {
      redirectToLimit(props.limitInfo?.limit, props.limitInfo?.resetAt);
      return;
    }

    const limitRes = await fetch('/api/posts/shot-tokens');
    if (limitRes.ok) {
      const limitData = await limitRes.json();
      if (limitData?.remaining !== undefined && limitData.remaining === 0) {
        redirectToLimit(limitData.limit ?? 5, limitData.resetAt);
        return;
      }
    }

    submitDoneRef.current = false;
    setIsSending(true);
    setSendingProgress(0);
    setShowPlane(false);
    setLoading(true);
    const controller = new AbortController();
    submitAbortRef.current = controller;

    try {
      const uploadData = new FormData();
      uploadData.append('image', props.imageFile);
      const uploadRes = await fetch('/api/upload/post', {
        method: 'POST',
        body: uploadData,
        signal: controller.signal
      });
      if (!uploadRes.ok) throw new Error('画像アップロード失敗');
      const uploadJson = await uploadRes.json();

      const postData: PostData = {
        imageUrl: uploadJson.imageUrl,
        title: props.title || undefined,
        caption: props.caption,
        tags: props.selectedTags.join(','),
        visibilityScope: props.visibilityScope,
        visibilityDuration: props.visibilityDuration === 'unlimited' ? null : props.visibilityDuration
      };

      if (props.latitude !== null && props.longitude !== null) {
        postData.latitude = props.latitude;
        postData.longitude = props.longitude;
        if (props.locationName) postData.locationName = props.locationName;
      }

      if (props.isQuestMode && props.selectedQuestId) {
        postData.questId = props.selectedQuestId;
      }

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        signal: controller.signal
      });

      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.error || '投稿作成失敗');

      submitDoneRef.current = true;
      setSendingProgress(100);
      setShowPlane(true);
      setTimeout(() => {
        router.push('/feed');
      }, 900);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // 中止時は何もしない
      } else {
        console.error(err);
        alert('投稿に失敗しました');
      }
      setIsSending(false);
      setSendingProgress(0);
      setShowPlane(false);
    } finally {
      setLoading(false);
      submitAbortRef.current = null;
    }
  };

  const handleCancelSending = () => {
    submitAbortRef.current?.abort();
    submitAbortRef.current = null;
    submitDoneRef.current = false;
    setIsSending(false);
    setSendingProgress(0);
    setShowPlane(false);
    setLoading(false);
  };

  // 送信進捗のアニメーション
  useEffect(() => {
    if (!isSending) return;
    const interval = window.setInterval(() => {
      setSendingProgress((prev) => {
        const cap = submitDoneRef.current ? 100 : 90;
        if (prev >= cap) return prev;
        return Math.min(prev + 6, cap);
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [isSending]);

  return {
    isSending,
    sendingProgress,
    showPlane,
    loading,
    submitPost,
    handleCancelSending,
  };
};
