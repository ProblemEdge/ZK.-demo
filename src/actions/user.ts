'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const searchUsers = async (query?: string, limit = 10, offset = 0) => {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  params.set('limit', `${limit}`);
  params.set('offset', `${offset}`);

  const res = await authFetch(`/api/users?${params.toString()}`);
  return parseJsonOrThrow(res);
};

export const getUserProfile = async (userId: string) => {
  const res = await authFetch(`/api/users/${userId}`);
  return parseJsonOrThrow(res);
};

export const getUserPosts = async (userId: string) => {
  const res = await authFetch(`/api/users/${userId}/posts`);
  return parseJsonOrThrow(res);
};

export const getUserBadges = async (userId: string) => {
  const res = await authFetch(`/api/users/${userId}/badges`);
  return parseJsonOrThrow(res);
};

export const getUserFollowers = async (userId: string) => {
  const res = await authFetch(`/api/users/${userId}/followers`);
  return parseJsonOrThrow(res);
};

export const followUser = async (targetUserId: string) => {
  const res = await authFetch('/api/follows/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId })
  });
  return parseJsonOrThrow(res);
};

export const unfollowUser = async (targetUserId: string) => {
  const res = await authFetch('/api/follows/unfollow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId })
  });
  return parseJsonOrThrow(res);
};

export const approveRequest = async (requesterId: string) => {
  const res = await authFetch('/api/follows/requests/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId })
  });
  return parseJsonOrThrow(res);
};

export const rejectRequest = async (requesterId: string) => {
  const res = await authFetch('/api/follows/requests/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesterId })
  });
  return parseJsonOrThrow(res);
};

export const getReceivedRequests = async () => {
  const res = await authFetch('/api/friends/requests/received');
  return parseJsonOrThrow(res);
};
