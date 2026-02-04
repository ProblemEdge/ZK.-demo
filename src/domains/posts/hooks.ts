'use client';

import useSWR from 'swr';
import { postSchema, commentSchema } from './schema';
import type { Post, Comment, CreatePost, CreateComment } from './schema';

const fetcher = (url: string) => fetch(url, { cache: 'no-store', credentials: 'include' }).then(res => res.json());

/**
 * 自分の投稿一覧を取得
 */
export function useMyPosts() {
  const { data, error, mutate, isLoading } = useSWR('/api/posts/my-posts', fetcher, {
    revalidateOnFocus: false,
  });

  let posts: Post[] = [];
  if (data?.posts) {
    posts = data.posts
      .map((p: unknown) => postSchema.safeParse(p))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Post }) => r.data);
  }

  return {
    posts,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 特定ユーザーの投稿一覧を取得
 */
export function useUserPosts(userId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? `/api/users/${userId}/posts` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  let posts: Post[] = [];
  if (data?.posts) {
    posts = data.posts
      .map((p: unknown) => postSchema.safeParse(p))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Post }) => r.data);
  }

  return {
    posts,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 投稿のコメント一覧を取得
 */
export function usePostComments(postId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    postId ? `/api/posts/${postId}/comments` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  let comments: Comment[] = [];
  if (data?.comments) {
    comments = data.comments
      .map((c: unknown) => commentSchema.safeParse(c))
      .filter((r: { success: boolean }) => r.success)
      .map((r: { success: true; data: Comment }) => r.data);
  }

  return {
    comments,
    error,
    mutate,
    isLoading,
  };
}

/**
 * 投稿を作成
 */
export async function createPost(data: CreatePost) {
  const res = await fetch('/api/posts/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || '投稿の作成に失敗しました');
  }

  return res.json();
}

/**
 * 投稿にいいねを追加/削除
 */
export async function toggleLike(postId: string) {
  const res = await fetch(`/api/posts/${postId}/likes`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('いいねの処理に失敗しました');
  }

  return res.json();
}

/**
 * コメントを追加
 */
export async function addComment(postId: string, data: CreateComment) {
  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'コメントの投稿に失敗しました');
  }

  return res.json();
}

/**
 * コメントを削除
 */
export async function deleteComment(postId: string, commentId: string) {
  const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('コメントの削除に失敗しました');
  }

  return res.json();
}

/**
 * 投稿トークンをリセット（デバッグ用）
 */
export async function resetShotTokens() {
  const res = await fetch('/api/posts/shot-tokens/reset', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('トークンのリセットに失敗しました');
  }

  return res.json();
}
