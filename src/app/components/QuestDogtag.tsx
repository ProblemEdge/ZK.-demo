import React from "react";
import QuestStatusTag, { QuestStatusType } from "./QuestStatusTag";

interface QuestDogtagProps {
  title: string;
  description: string;
  status: QuestStatusType;
}

export default function QuestDogtag({ title, description, status }: QuestDogtagProps) {
  // ステータスに応じたボーダー色を決定
  const getBorderColor = () => {
    switch (status) {
      case "completed":
        return "border-[#00e676]";
      case "in-progress":
        return "border-[#ffc400]";
      case "hidden":
        return "border-[#7c4dff]";
      case "incomplete":
      default:
        return "border-white";
    }
  };

  return (
    <div className={`bg-[#14161a] border ${getBorderColor()} rounded-[20px] px-4 py-3 relative w-full`}>
      {/* 右上のステータスタグ */}
      <div className="absolute right-2 top-2">
        <QuestStatusTag status={status} />
      </div>
      
      {/* クエスト情報 */}
      <div className="pr-12">
        <p className="text-white text-sm font-bold mb-1">{title}</p>
        <p className="text-white text-xs">{description}</p>
      </div>
    </div>
  );
}
