import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ShotTokens, LimitInfo } from '../_types';

/**
 * ショットトークンを管理するカスタムフック
 */
export const useTokens = () => {
  const router = useRouter();
  const [tokens, setTokens] = useState<ShotTokens | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);

  const redirectToLimit = useCallback((limit?: number, resetAt?: string) => {
    const limitValue = limit ?? 5;
    const resetAtParam = resetAt ? encodeURIComponent(resetAt) : '';
    router.replace(`/post/limit?limit=${limitValue}&resetAt=${resetAtParam}`);
  }, [router]);

  useEffect(() => {
    fetch('/api/posts/shot-tokens')
      .then(res => res.json())
      .then(data => {
        if (data.remaining !== undefined) {
          const limit = data.limit ?? 5;
          setTokens({ remaining: data.remaining, total: limit });
          setLimitInfo({ limit, resetAt: data.resetAt });
          setIsLimitReached(data.remaining === 0);

          if (data.remaining === 0) {
            redirectToLimit(limit, data.resetAt);
          }
        }
      })
      .catch(err => console.error('トークン取得エラー:', err));
  }, [redirectToLimit]);

  return {
    tokens,
    isLimitReached,
    limitInfo,
    setTokens,
    setIsLimitReached,
    setLimitInfo,
    redirectToLimit,
  };
};
