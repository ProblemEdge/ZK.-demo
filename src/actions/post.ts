'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const getFeedPosts = async (limit = 10, offset = 0) => {
  const params = new URLSearchParams();
  params.set('limit', `${limit}`);
  params.set('offset', `${offset}`);
  const res = await authFetch(`/api/feed?${params.toString()}`);
  return parseJsonOrThrow(res);
};

export const getMyPosts = async () => {
  const res = await authFetch('/api/posts/my-posts');
  return parseJsonOrThrow(res);
};

export const getPendingPosts = async () => {
  const res = await authFetch('/api/posts/pending');
  return parseJsonOrThrow(res);
};

export const likePost = async (postId: string) => {
  const res = await authFetch(`/api/posts/${postId}/likes`, {
    method: 'POST'
  });
  return parseJsonOrThrow(res);
};

export const unlikePost = async (postId: string) => {
  const res = await authFetch(`/api/posts/${postId}/likes`, {
    method: 'DELETE'
  });
  return parseJsonOrThrow(res);
};

export const getComments = async (postId: string) => {
  const res = await authFetch(`/api/posts/${postId}/comments`);
  return parseJsonOrThrow(res);
};

export const createComment = async (postId: string, text: string) => {
  const res = await authFetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return parseJsonOrThrow(res);
};

export const deleteComment = async (postId: string, commentId: string) => {
  const res = await authFetch(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE'
  });
  return parseJsonOrThrow(res);
};

export const resetShotTokens = async () => {
  const res = await authFetch('/api/posts/shot-tokens/reset', {
    method: 'POST'
  });
  return parseJsonOrThrow(res);
};

export const deletePost = async (postId: string) => {
  const res = await authFetch(`/api/posts/${postId}`, {
    method: 'DELETE'
  });
  return parseJsonOrThrow(res);
};
