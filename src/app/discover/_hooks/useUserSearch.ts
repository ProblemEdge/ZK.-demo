import { useState, useEffect } from 'react';
import type { User } from '../_types';

/**
 * ユーザー検索を管理するカスタムフック
 */
export const useUserSearch = (debouncedQuery: string, mainTab: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchUsers = async (page: number = userPage) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const query = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : '';
      const separator = query ? '&' : '?';
      const url = `/api/users${query}${separator}limit=10&offset=${(page - 1) * 10}`;
      
      const res = await fetch(url, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('ユーザーの取得に失敗しました');
      }

      const data = await res.json();
      
      if (page === 1) {
        setUsers(data);
      } else {
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = data.filter((u: User) => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
      }
      
      setHasMoreUsers(data.length === 10);
      setUserPage(page);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (page === 1) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'search') {
      setUserPage(1);
      setHasMoreUsers(true);
      fetchUsers(1);
    }
  }, [debouncedQuery, mainTab]);

  return {
    users,
    setUsers,
    loading,
    userPage,
    hasMoreUsers,
    isLoadingMore,
    fetchUsers,
  };
};
