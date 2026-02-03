'use server';

import { authFetch, parseJsonOrThrow } from './_internal';

export const getNotifications = async () => {
  const res = await authFetch('/api/notifications');
  return parseJsonOrThrow(res);
};

export const markNotificationsAsRead = async (ids?: string[]) => {
  const res = await authFetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return parseJsonOrThrow(res);
};

export const getUnreadCount = async () => {
  const res = await authFetch('/api/notifications/unread-count');
  return parseJsonOrThrow(res);
};
