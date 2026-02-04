'use client';

import useSWR from 'swr';
import { userSchema, searchUserSchema, followerSchema } from './schema';
import type { User, SearchUser, Follower, UpdateProfile } from './schema';

const fetcher = (url: string) => fetch(url, { cache: 'no-store', credentials: 'include' }).then(res => res.json());

/**
 * 現在ログイン中のユーザー情報を取得
 */
export function useCurrentUser() {
  const { data, error, mutate, isLoading } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
  });

  let user: User | null = null;
  if (data) {
    const parsed = userSchema.safeParse(data);
    user = parsed.success ? parsed.data : null;
  }

  return {
    user,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 特定ユーザーのプロフィールを取得（関係性情報含む）
 */
export function useUserProfile(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  let user: User | null = null;
  let isFriend = false;
  let isRequestedByMe = false;
  let isRequestingMe = false;

  if (data?.user) {
    const parsed = userSchema.safeParse(data.user);
    user = parsed.success ? parsed.data : null;
    isFriend = data.isFriend || false;
    isRequestedByMe = data.isRequestedByMe || false;
    isRequestingMe = data.isRequestingMe || false;
  }

  return {
    user,
    isFriend,
    isRequestedByMe,
    isRequestingMe,
    error,
    mutate,
    isLoading,
  };
}

/**
 * ユーザー検索
 */
export function useUserSearch(query: string, limit = 10) {
  const shouldFetch = query.trim().length >= 2;
  
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/users?q=${encodeURIComponent(query)}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300,
    }
  );

  let users: SearchUser[] = [];
  if (data?.users) {
    users = data.users
      .map((u: unknown) => searchUserSchema.safeParse(u))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: SearchUser }) => r.data);
  }

  return {
    users,
    error,
    isLoading,
  };
}

/**
 * ユーザーのフォロワーリストを取得
 */
export function useUserFollowers(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? `/api/users/${userId}/followers` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  let followers: Follower[] = [];
  if (data?.followers) {
    followers = data.followers
      .map((f: unknown) => followerSchema.safeParse(f))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Follower }) => r.data);
  }

  return {
    followers,
    error,
    mutate,
    isLoading,
  };
}

/**
 * プロフィール更新
 */
export async function updateUserProfile(data: UpdateProfile) {
  const res = await fetch('/api/auth/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'プロフィールの更新に失敗しました');
  }

  return res.json();
}

/**
 * ユーザーをフォロー
 */
export async function followUser(targetUserId: string) {
  const res = await fetch('/api/follows/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId }),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('フォローに失敗しました');
  }

  return res.json();
}

/**
 * ユーザーのフォローを解除
 */
export async function unfollowUser(targetUserId: string) {
  const res = await fetch('/api/follows/unfollow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId }),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('フォロー解除に失敗しました');
  }

  return res.json();
}
