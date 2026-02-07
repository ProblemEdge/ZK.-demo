import { useState } from 'react';
import type { Post } from '../_types';

/**
 * 投票機能を管理するカスタムフック
 */
export const useVotes = () => {
  const handleVote = async (postId: string, type: 'approve' | 'reject', setPosts: React.Dispatch<React.SetStateAction<Post[]>>) => {
    try {
      const res = await fetch('/api/votes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, voteType: type }),
        credentials: 'include'
      });

      if (res.ok) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const approveAdd = type === 'approve' ? 1 : 0;
            const rejectAdd = type === 'reject' ? 1 : 0;
            return {
              ...p,
              hasVoted: true,
              approveCount: (p.approveCount || 0) + approveAdd,
              rejectCount: (p.rejectCount || 0) + rejectAdd,
              totalVotes: (p.totalVotes || 0) + 1
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const processExpiredVotes = async () => {
    try {
      await fetch('/api/votes/process-expired', { credentials: 'include' });
    } catch (err) {
      console.error('Error processing expired votes:', err);
    }
  };

  return {
    handleVote,
    processExpiredVotes,
  };
};
