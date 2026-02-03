import { useState } from 'react';
import type { Post } from '../_types';

/**
 * いいね機能を管理するカスタムフック
 */
export const useLikes = () => {
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const handleLike = async (postId: string, posts: Post[], setPosts: React.Dispatch<React.SetStateAction<Post[]>>) => {
    // 処理中なら無視
    if (likingPosts.has(postId)) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const wasLiked = post.hasLiked;
    const originalLikeCount = post.likeCount || 0;

    try {
      setLikingPosts(prev => new Set(prev).add(postId));

      // 楽観的更新
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
              ...p,
              hasLiked: !wasLiked,
              likeCount: Math.max(0, (p.likeCount || 0) + (wasLiked ? -1 : 1))
            }
          : p
      ));
      
      const method = wasLiked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/posts/${postId}/likes`, { method, credentials: 'include' });

      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, hasLiked: !wasLiked, likeCount: data.likeCount }
            : p
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
      // 失敗時は元に戻す
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, hasLiked: wasLiked, likeCount: originalLikeCount }
          : p
      ));
    } finally {
      setLikingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  return {
    handleLike,
    likingPosts,
  };
};
