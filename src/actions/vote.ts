'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const createVote = async (postId: string, voteType: 'approve' | 'reject') => {
  const res = await authFetch('/api/votes/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, voteType })
  });
  return parseJsonOrThrow(res);
};

export const processExpiredVotes = async () => {
  const res = await authFetch('/api/votes/process-expired');
  return parseJsonOrThrow(res);
};
