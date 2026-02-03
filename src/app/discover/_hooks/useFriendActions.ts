import { useState } from 'react';
import type { User } from '../_types';

/**
 * フレンド関連の操作を管理するカスタムフック
 */
export const useFriendActions = (refresh: () => Promise<void>) => {
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [receivedRequests, setReceivedRequests] = useState<User[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchReceivedRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch('/api/friends/requests/received', {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('リクエストの取得に失敗しました');
      }

      const data = await res.json();
      setReceivedRequests(data);
    } catch (err) {
      console.error('Error fetching received requests:', err);
      setReceivedRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleFollow = async (
    targetUserId: string,
    e: React.MouseEvent,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
  ) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(targetUserId));
    try {
      const res = await fetch('/api/follows/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Follow error response:', data);
        alert(data.error || 'フォローに失敗しました');
        return;
      }

      setUsers(prevUsers => 
        prevUsers.map(u => u.id === targetUserId ? { ...u, isFriend: false, isRequested: true } : u)
      );
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

  const handleUnfollow = async (
    targetUserId: string,
    e: React.MouseEvent,
    isRequest: boolean,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
  ) => {
    e.stopPropagation();
    
    if (!isRequest && !confirm('本当にこのユーザーとの友達関係を削除しますか？')) {
      return;
    }
    
    setLoadingUserIds(prev => new Set(prev).add(targetUserId));
    try {
      const endpoint = isRequest ? '/api/friends/requests/cancel' : '/api/follows/unfollow';
      const bodyData = { targetUserId };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('API Error:', errorMessage);
        return;
      }

      setUsers(prevUsers =>
        prevUsers.map(u => u.id === targetUserId ? { ...u, isFriend: false, isRequested: false } : u)
      );
      
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

  const handleApproveRequest = async (
    requesterId: string,
    e: React.MouseEvent,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
  ) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(requesterId));
    try {
      const res = await fetch('/api/friends/requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Approve error response:', data);
        alert(data.error || '承認に失敗しました');
        return;
      }

      setReceivedRequests(prevRequests => prevRequests.filter(r => r.id !== requesterId));
      setUsers(prevUsers => prevUsers.filter(u => u.id !== requesterId));
      
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

  const handleRejectRequest = async (
    requesterId: string,
    e: React.MouseEvent,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
  ) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(requesterId));
    try {
      const res = await fetch('/api/friends/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId })
      });

      if (!res.ok) {
        console.error('Reject error response:', res);
        return;
      }

      setReceivedRequests(prevRequests => prevRequests.filter(r => r.id !== requesterId));
      setUsers(prevUsers => prevUsers.filter(u => u.id !== requesterId));
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
