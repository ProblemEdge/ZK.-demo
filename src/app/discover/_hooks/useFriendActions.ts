import { useState, useCallback } from 'react';
import type { User } from '../_types';
import {
  followUser,
  unfollowUser,
  approveRequest,
  rejectRequest,
  getReceivedRequests
} from '@/actions/user';

/**
 * フレンド関連の操作を管理するカスタムフック
 */
export const useFriendActions = (
  refresh: () => Promise<void>,
  setUsers?: React.Dispatch<React.SetStateAction<User[]>>
) => {
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [receivedRequests, setReceivedRequests] = useState<User[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchReceivedRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const data = await getReceivedRequests();
      setReceivedRequests(data as User[]);
    } catch (err) {
      console.error('Error fetching received requests:', err);
      setReceivedRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const handleFollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(targetUserId));
    try {
      await followUser(targetUserId);

      if (setUsers) {
        setUsers(prevUsers =>
          prevUsers.map(u => u.id === targetUserId ? { ...u, isFriend: false, isRequested: true } : u)
        );
      }
    } catch (err) {
      console.error('Follow error:', err);
      alert('フォローに失敗しました');
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const handleUnfollow = async (targetUserId: string, e: React.MouseEvent, isRequest: boolean = false) => {
    e.stopPropagation();

    if (!isRequest && !confirm('本当にこのユーザーとの友達関係を削除しますか？')) {
      return;
    }

    setLoadingUserIds(prev => new Set(prev).add(targetUserId));
    try {
      await unfollowUser(targetUserId);

      if (setUsers) {
        setUsers(prevUsers =>
          prevUsers.map(u => u.id === targetUserId ? { ...u, isFriend: false, isRequested: false } : u)
        );
      }

      await refresh();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const handleApproveRequest = async (requesterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(requesterId));
    try {
      await approveRequest(requesterId);
      setReceivedRequests(prevRequests => prevRequests.filter(r => r.id !== requesterId));

      if (setUsers) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== requesterId));
      }

      await refresh();
    } catch (err) {
      console.error('Approve error:', err);
      alert('承認に失敗しました');
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requesterId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requesterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(requesterId));
    try {
      await rejectRequest(requesterId);
      setReceivedRequests(prevRequests => prevRequests.filter(r => r.id !== requesterId));

      if (setUsers) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== requesterId));
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requesterId);
        return newSet;
      });
    }
  };

  return {
    loadingUserIds,
    receivedRequests,
    requestsLoading,
    fetchReceivedRequests,
    handleFollow,
    handleUnfollow,
    handleApproveRequest,
    handleRejectRequest,
  };
};
