"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function ImageWithPlaceholder({
  src,
  alt,
  className = '',
  style,
  fallbackSrc,
  fallbackInitial,
}: {
  src: string | undefined | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  fallbackInitial?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showInitials, setShowInitials] = useState(false);
  const seed = useRef<string>('');
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // ランダムテキストを決定（srcごとに再生成）
    const samples = ['matsu', 'now', 'kaze', 'sora', 'niko', 'はやく', 'ぽすと', 'ランダム'];
    seed.current = samples[Math.floor(Math.random() * samples.length)];
  }, [src]);

  useEffect(() => {
    // リセット when src changes
    setLoaded(false);
    setError(false);
    setShowInitials(false);
  }, [src]);

  if (!src) return null;

  const handleError = () => {
    if (fallbackSrc && imgRef.current && imgRef.current.src !== fallbackSrc) {
      imgRef.current.src = fallbackSrc;
      return;
    }
    if (fallbackInitial) {
      setShowInitials(true);
      return;
    }
    setError(true);
  };

  return (
    <div className={`relative flex items-center justify-center bg-black ${className}`} style={style}>
      {!loaded && !showInitials && (
        <div className="w-full h-full flex items-center justify-center text-white text-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-medium">{seed.current}</div>
          </div>
        </div>
      )}

      {showInitials ? (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
          {fallbackInitial}
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={loaded ? undefined : { pointerEvents: 'none' }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">画像読み込み失敗</div>
      )}
    </div>
  );
}
