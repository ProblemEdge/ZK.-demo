import React from "react";

interface QuestTagProps {
  children: React.ReactNode;
}

// Figmaのデザインを再現。アイコンは仮で🧭を使用（SVGや画像に差し替え可）
export default function QuestTag({ children }: QuestTagProps) {
  return (
    <div className="inline-flex items-center gap-1 px-[5px] py-[4px] rounded-[30px] border-2 border-white bg-pink-500/80">
      <img src="/icon/quest.svg" alt="クエスト" className="w-5 h-5 mr-1" />
      <span className="font-bold text-white text-[14px] whitespace-pre-wrap">{children}</span>
    </div>
  );
}
