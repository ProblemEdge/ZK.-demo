import React from "react";

interface CommentButtonProps {
  count: number;
  onClick?: () => void;
}

export default function CommentButton({ count, onClick }: CommentButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center relative px-1 py-1"
      onClick={onClick}
    >
      <div className="relative w-14 h-8">
        <div className="absolute bg-white border-[3px] border-[#868686] rounded-[24px] w-14 h-8 left-0 top-0" />
        <div className="absolute left-[7px] top-[7px] w-[18px] h-[18px] flex items-center justify-center overflow-clip">
          <img src="/icon/Message square.svg" alt="コメント" className="w-full h-full" />
        </div>
        {/* コメント数を楕円内右端にスナップ */}
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-[#868686] text-[12px] text-center font-sans pointer-events-none">
          {count}
        </span>
      </div>
    </button>
  );
}
