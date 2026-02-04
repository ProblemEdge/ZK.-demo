'use client';

import useSWR from 'swr';
import { badgeSchema, userBadgeSchema } from './schema';
import type { Badge, UserBadge, CreateBadge, ManageBadge } from './schema';

const fetcher = (url: string) => fetch(url, { cache: 'no-store', credentials: 'include' }).then(res => res.json());

/**
 * 全バッジ一覧を取得
 */
export function useBadges() {
  const { data, error, mutate, isLoading } = useSWR('/api/badges', fetcher, {
    revalidateOnFocus: false,
  });

  let badges: Badge[] = [];
  if (data?.badges) {
    badges = data.badges
      .map((b: unknown) => badgeSchema.safeParse(b))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Badge }) => r.data);
  }

  return {
    badges,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 特定ユーザーのバッジ一覧を取得
 */
export function useUserBadges(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? `/api/users/${userId}/badges` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  let badges: UserBadge[] = [];
  if (data?.badges) {
    badges = data.badges
      .map((b: unknown) => userBadgeSchema.safeParse(b))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: UserBadge }) => r.data);
  }

  return {
    badges,
    error,
    mutate,
    isLoading,
  };
}

/**
 * バッジを作成
 */
export async function createBadge(data: CreateBadge) {
  const res = await fetch('/api/badges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'バッジの作成に失敗しました');
  }

  return res.json();
}

/**
 * バッジを付与
 */
export async function awardBadge(data: ManageBadge) {
  const res = await fetch('/api/badges/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'バッジの付与に失敗しました');
  }

  return res.json();
}

/**
 * バッジをはく奪
 */
export async function revokeBadge(data: ManageBadge) {
  const res = await fetch('/api/badges/award', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'バッジのはく奪に失敗しました');
  }

  return res.json();
}

/**
 * バッジを削除
 */
export async function deleteBadge(badgeId: string) {
  const res = await fetch(`/api/badges/${badgeId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'バッジの削除に失敗しました');
  }

  return res.json();
}
