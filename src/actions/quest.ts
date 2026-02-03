'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const getTodayQuests = async () => {
  const res = await authFetch('/api/quests/today');
  return parseJsonOrThrow(res);
};
