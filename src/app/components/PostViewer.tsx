"use client";

import { useEffect, useRef, useState } from 'react';

interface Post {
  id: string;
  imageUrl: string;
  caption?: string;
}

export default function PostViewer({ posts, initialIndex = 0, onClose }: { posts: Post[]; initialIndex?: number; onClose?: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  useEffect(() => setScale(1), [index]);

  const prev = () => setIndex(i => (i > 0 ? i - 1 : i));
  const next = () => setIndex(i => (i < posts.length - 1 ? i + 1 : i));

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    moved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (Math.abs(dx) > 20) moved.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = (e.changedTouches[0].clientX - startX.current);
    startX.current = null;
    if (!moved.current) return; 
    if (dx < -50) next();
    if (dx > 50) prev();
  };

  const toggleZoom = () => setScale(s => (s === 1 ? 2 : 1));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => onClose?.()}>
      <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button className="absolute left-3 top-3 text-white text-2xl" onClick={() => onClose?.()}>✕</button>
        <button className="absolute left-3 top-16 text-white text-3xl" onClick={prev} aria-label="prev">‹</button>
        <button className="absolute right-3 top-16 text-white text-3xl" onClick={next} aria-label="next">›</button>

        <div
          className="flex items-center justify-center touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={toggleZoom}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          <img
            src={posts[index]?.imageUrl}
            alt={posts[index]?.caption || ''}
            style={{ transform: `scale(${scale})`, transition: 'transform 200ms ease' }}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white max-w-[90%]">
          <p className="text-sm truncate">{posts[index]?.caption}</p>
          <p className="text-xs mt-1">{index + 1} / {posts.length}</p>
        </div>
      </div>
    </div>
  );
}
