import React from "react";

export type QuestStatusType = "hidden" | "completed" | "in-progress" | "incomplete";

interface QuestStatusTagProps {
  status: QuestStatusType;
}

export default function QuestStatusTag({ status }: QuestStatusTagProps) {
  if (status === "hidden") {
    // 非表示 (紫)
    return (
      <div className="bg-[#14161a] border border-[#7c4dff] flex items-center justify-center px-1 py-0.5 rounded-[32px]">
        <img src="/icon/Eye off.svg" alt="非表示" className="w-5 h-5" />
      </div>
    );
  }

  if (status === "completed") {
    // 完了 (緑)
    return (
      <div className="bg-[#14161a] border border-[#00e676] flex items-center justify-center px-2 py-0.5 rounded-[32px]">
        <span className="text-[#00e676] text-[8px] font-bold">完了</span>
      </div>
    );
  }

  if (status === "in-progress") {
    // 進行中 (黄色)
    return (
      <div className="bg-[#14161a] border border-[#ffc400] flex items-center justify-center px-1 py-0.5 rounded-[32px]">
        <span className="text-[#ffc400] text-[8px] font-bold">進行中</span>
      </div>
    );
  }

  // 未完了 (グレー)
  return (
    <div className="bg-[#14161a] border border-[#bfbdbd] flex items-center justify-center px-1 py-0.5 rounded-[32px]">
      <span className="text-[#bfbdbd] text-[8px] font-bold">未完了</span>
    </div>
  );
}
