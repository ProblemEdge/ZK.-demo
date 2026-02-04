'use client';

import useSWR from 'swr';
import { questSchema } from './schema';
import type { Quest } from './schema';

const fetcher = (url: string) => fetch(url, { cache: 'no-store', credentials: 'include' }).then(res => res.json());

/**
 * 今日のクエスト一覧を取得
 */
export function useTodayQuests() {
  const { data, error, mutate, isLoading } = useSWR('/api/quests/today', fetcher, {
    revalidateOnFocus: false,
  });

  let quests: Quest[] = [];
  if (data?.quests) {
    quests = data.quests
      .map((q: unknown) => questSchema.safeParse(q))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Quest }) => r.data);
  }

  return {
    quests,
    error,
    mutate,
    isLoading,
  };
}

/**
 * クエストをリセット（デバッグ用）
 */
export async function resetQuests() {
  const res = await fetch('/api/quests/today/reset', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('クエストのリセットに失敗しました');
  }

  return res.json();
}
