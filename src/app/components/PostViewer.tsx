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
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const startX = useRef<number | null>(null);
  const moved = useRef(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const naturalSize = useRef({ w: 0, h: 0 });
  const startPan = useRef<{ x: number; y: number } | null>(null);
  const startTranslate = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const [maxScale, setMaxScale] = useState(3);

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
  
  useEffect(() => {
    // reset translate when scale returns to 1
    if (scale === 1) setTranslate({ x: 0, y: 0 });
  }, [scale]);

  const prev = () => setIndex(i => (i > 0 ? i - 1 : i));
  const next = () => setIndex(i => (i < posts.length - 1 ? i + 1 : i));

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX;
      moved.current = false;
      if (scale > 1) {
        // start pan
        startPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        startTranslate.current = { ...translate };
      }
    } else if (e.touches.length === 2) {
      // pinch start
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinch.current = { dist: d, scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (scale > 1 && startPan.current && startTranslate.current) {
        const dx = e.touches[0].clientX - startPan.current.x;
        const dy = e.touches[0].clientY - startPan.current.y;
        setTranslate({ x: startTranslate.current.x + dx, y: startTranslate.current.y + dy });
      } else {
        if (startX.current == null) return;
        const dx = e.touches[0].clientX - startX.current;
        if (Math.abs(dx) > 20) moved.current = true;
      }
    } else if (e.touches.length === 2 && pinch.current) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = (d / pinch.current.dist) * pinch.current.scale;
      const clamped = Math.max(1, Math.min(maxScale, scaleFactor));
      setScale(clamped);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinch.current) {
      pinch.current = null;
      return;
    }

    if (startX.current == null) return;
    const dx = (e.changedTouches[0].clientX - startX.current);
    startX.current = null;
    if (!moved.current) return; 
    if (dx < -50) next();
    if (dx > 50) prev();
  };

  const clamp = (v: number) => Math.max(1, Math.min(maxScale, v));

  const toggleZoom = () => setScale(s => (s === 1 ? Math.max(3, Math.min(maxScale, 3)) : 1));

  const handleImgLoad = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    naturalSize.current.w = img.naturalWidth || 0;
    naturalSize.current.h = img.naturalHeight || 0;
    const rect = container.getBoundingClientRect();
    const displayedW = rect.width;
    // allow image's natural size to determine maxScale (so 1:1 fits)
    const ratio = naturalSize.current.w / displayedW || 1;
    const computed = Math.max(2, Math.min(12, ratio * 1.5));
    setMaxScale(computed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => onClose?.()}>
      <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button className="absolute left-3 top-3 text-white text-2xl" onClick={() => onClose?.()}>✕</button>
        <button className="absolute left-3 top-16 text-white text-3xl" onClick={prev} aria-label="prev">‹</button>
        <button className="absolute right-3 top-16 text-white text-3xl" onClick={next} aria-label="next">›</button>

        <div
          ref={containerRef}
          className="flex items-center justify-center touch-pan-y overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={toggleZoom}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          <div
            style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transition: 'transform 120ms ease' }}
            className="max-w-full max-h-[90vh] touch-none"
          >
            <img
              ref={imgRef}
              src={posts[index]?.imageUrl || undefined}
              alt={posts[index]?.caption || ''}
              onLoad={handleImgLoad}
              className="block max-w-full max-h-[90vh] object-contain rounded-lg"
              draggable={false}
            />
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white max-w-[90%]">
          <p className="text-sm truncate">{posts[index]?.caption}</p>
          <p className="text-xs mt-1">{index + 1} / {posts.length}</p>
        </div>
      </div>
    </div>
  );
}
