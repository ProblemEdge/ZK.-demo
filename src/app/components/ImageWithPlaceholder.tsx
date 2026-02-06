"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function ImageWithPlaceholder({
  src,
  alt,
  className = '',
  style,
}: {
  src: string | undefined | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const seed = useRef<string>('');

  useEffect(() => {
    // ランダムテキストを決定（マウントごと）
    const samples = ['matsu', 'now', 'kaze', 'sora', 'niko', 'はやく', 'ぽすと', 'ランダム'];
    seed.current = samples[Math.floor(Math.random() * samples.length)];
  }, []);

  useEffect(() => {
    // リセット when src changes
    setLoaded(false);
    setError(false);
  }, [src]);

  if (!src) return null;

  return (
    <div className={`flex items-center justify-center bg-black ${className}`} style={style}>
      {!loaded && (
        <div className="w-full h-full flex items-center justify-center text-white text-lg">
          <div className="p-4 text-center">
            <div className="text-2xl font-medium">{seed.current}</div>
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt || ''}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={loaded ? undefined : { pointerEvents: 'none' }}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">画像読み込み失敗</div>
      )}
    </div>
  );
}
