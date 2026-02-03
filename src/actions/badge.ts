'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const verifyAdmin = async (accessKey: string) => {
  const res = await authFetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessKey })
  });
  return parseJsonOrThrow(res);
};

export const getAllBadges = async () => {
  const res = await authFetch('/api/badges');
  return parseJsonOrThrow(res);
};

export const createBadge = async (payload: {
  name: string;
  displayName: string;
  description: string;
  imageUrl: string;
}) => {
  const res = await authFetch('/api/badges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJsonOrThrow(res);
};

export const awardBadge = async (payload: { userId: string; badgeName: string }) => {
  const res = await authFetch('/api/badges/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJsonOrThrow(res);
};

export const revokeBadge = async (payload: { userId: string; badgeName: string }) => {
  const res = await authFetch('/api/badges/award', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJsonOrThrow(res);
};

export const deleteBadge = async (badgeId: string) => {
  const res = await authFetch(`/api/badges/${badgeId}`, {
    method: 'DELETE'
  });
  return parseJsonOrThrow(res);
};
