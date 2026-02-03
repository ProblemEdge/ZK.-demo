import type { User, FriendFilter } from '../_types';

/**
 * フレンドフィルターを適用したユーザーリストを取得
 */
export const getFilteredUsers = (users: User[], friendFilter: FriendFilter): User[] => {
  const filtered = users.filter(user => {
    if (friendFilter === 'discover') return !user.isFriend && !user.isRequested && !user.isReceivedRequest;
    if (friendFilter === 'friend') return user.isFriend === true;
    if (friendFilter === 'pending') return user.isRequested === true;
    if (friendFilter === 'request') return false;
    return true;
  });

  // 重複を排除
  return Array.from(
    new Map(filtered.map(user => [user.id, user])).values()
  );
};
