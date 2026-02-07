"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function ImageWithPlaceholder({
  src,
  alt,
  className = '',
  style,
  fallbackSrc,
  fallbackInitial,
  showRandomText,
}: {
  src: string | undefined | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  fallbackInitial?: string;
  showRandomText?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showInitials, setShowInitials] = useState(false);
  const seed = useRef<string>('');
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // ランダムテキストを決定（srcごとに再生成）
    if (showRandomText) {
      const samples = ['matsu', 'now', 'kaze', 'sora', 'niko', 'はやく', 'ぽすと', 'ランダム'];
      seed.current = samples[Math.floor(Math.random() * samples.length)];
    }
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
    // 親コンテキストで背景色を制御できるように、デフォルトの黒背景を除去
    // `className` はコンテナと img の両方に適用して、呼び出し側で `object-cover` 等を指定できるようにする
    <div className={`relative flex items-center justify-center ${className}`} style={style}>
      {!loaded && !showInitials && showRandomText && (
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
          // apply caller's className also to the img so object-fit utilities work as expected
          className={`max-w-full max-h-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          style={loaded ? undefined : { pointerEvents: 'none' }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">画像読み込み失敗</div>
      )}
    </div>
  );
}
