import { useState, useCallback } from 'react';
import type { Comment } from '../_types';

/**
 * コメント機能を管理するカスタムフック
 */
export const useComments = () => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  const [commentText, setCommentText] = useState('');

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
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
  };
};
