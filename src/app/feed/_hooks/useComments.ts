import { useState, useCallback } from 'react';
import type { Comment } from '../_types';

/**
 * コメント機能を管理するカスタムフック
 */
export const useComments = () => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  // meta: offset and hasMore per post
  const [commentsMeta, setCommentsMeta] = useState<{ [key: string]: { offset: number; hasMore: boolean } }>({});
  const [commentText, setCommentText] = useState('');

  const fetchComments = async (postId: string) => {
    try {
      const limit = 10;
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments?limit=${limit}&offset=0`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // server returns newest-first (desc) — reverse to chronological (oldest -> newest)
        const asc = (data as Comment[]).slice().reverse();
        setComments(prev => ({ ...prev, [postId]: asc }));
        setCommentsMeta(prev => ({ ...prev, [postId]: { offset: (data as Comment[]).length, hasMore: (data as Comment[]).length === limit } }));
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const loadMoreComments = async (postId: string) => {
    try {
      const limit = 10;
      const meta = commentsMeta[postId] || { offset: 0, hasMore: true };
      if (!meta.hasMore) return false;
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments?limit=${limit}&offset=${meta.offset}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const asc = (data as Comment[]).slice().reverse();
        setComments(prev => ({ ...prev, [postId]: [...asc, ...(prev[postId] || [])] }));
        setCommentsMeta(prev => ({ ...prev, [postId]: { offset: meta.offset + (data as Comment[]).length, hasMore: (data as Comment[]).length === limit } }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Load more comments error:', err);
      return false;
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = useCallback((postId: string) => {
    setExpandedPostId(prevId => {
      if (prevId === postId) return null;
      if (!comments[postId]) fetchComments(postId);
      return postId;
    });
  }, [comments]);

  const handleComment = async (postId: string, text: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include'
      });

      if (res.ok) {
        await fetchComments(postId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Comment error:', err);
      return false;
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('コメントを削除しますか？')) return false;
    
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c.id !== commentId)
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete comment error:', err);
      return false;
    }
  };

  return {
    expandedPostId,
    setExpandedPostId,
    comments,
    loadingComments,
    commentText,
    setCommentText,
    handleToggleComments,
    handleComment,
    handleDeleteComment,
    fetchComments,
    loadMoreComments,
    commentsMeta,
  };
};
