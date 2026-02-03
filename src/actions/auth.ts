'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const getMe = async () => {
  const res = await authFetch('/api/auth/me');
  return parseJsonOrThrow(res);
};
