import React from "react";

export default function SuccessTag() {
  return (
    <div className="bg-[#00e676] border-[3px] border-[#065512] border-solid flex items-center opacity-80 px-5 py-1 rounded-[30px]">
      {/* チェックマークアイコンをCSSだけで再現 */}
      <div className="relative w-6 h-6 mr-2">
        {/* 外枠 */}
        <div className="absolute inset-0 bg-transparent border-2 border-white rounded-[10px]" />
        {/* チェックマーク（2本の線） */}
        <div className="absolute left-[7px] top-[12px] w-[2.8px] h-[16.8px] bg-white rounded-[8px] rotate-45" />
        <div className="absolute left-[13px] top-[17px] w-[2.8px] h-[9.8px] bg-white rounded-[8px] -rotate-45" />
      </div>
    </div>
  );
}
