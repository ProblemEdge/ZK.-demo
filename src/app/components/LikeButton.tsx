"use client";
import React, { useState, useEffect } from "react";

interface LikeButtonProps {
  count: number;
  initialLiked?: boolean;
  onClick?: () => void;
}

export default function LikeButton({ count, initialLiked = false, onClick }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [anim, setAnim] = useState(false);

  // initialLiked が変わったときに liked を同期
  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  // アニメーション用クラス
  const heartAnim = anim ? "animate-bounce" : "";

  return (
    <button
      type="button"
      className="flex items-center relative px-1 py-1"
      onClick={() => {
        setLiked((v) => !v);
        setAnim(true);
        setTimeout(() => setAnim(false), 400);
        onClick?.();
      }}
      aria-pressed={liked}
    >
      <div className="relative w-14 h-8">
        <div
          className={`absolute left-0 top-0 w-14 h-8 rounded-[24px] border-[3px] ${
            liked
              ? "bg-[#ff9df8] border-[#ff1da5]"
              : "bg-[#ffcffc] border-[#ff73c7]"
          }`}
        />
        <img
          src={liked ? "/icon/like_after.svg" : "/icon/like_before.svg"}
          alt={liked ? "いいね済み" : "いいね"}
          className={`absolute left-[15.5px] top-[9px] w-[21px] h-[17px] -translate-x-1/2 flex items-center justify-center select-none ${heartAnim}`}
          draggable={false}
        />
      </div>
      <span
        className={`absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[12px] text-center font-sans pointer-events-none ${liked ? "text-white" : "text-[#ff73c7]"}`}
        style={{minWidth: 0}}
      >
        {count + (liked ? 1 : 0)}
      </span>
    </button>
  );
}
