import React from "react";

interface SimpleTagProps {
  label: string;
}

export default function SimpleTag({ label }: SimpleTagProps) {
  return (
    <div className="min-w-[48px] h-5 px-2 py-1 bg-blue-300 rounded-[30px] outline outline-2 outline-offset-[-2px] outline-indigo-600 inline-flex justify-start items-center gap-0.5 w-auto">
      <div className="w-3 h-3 relative overflow-hidden flex items-center justify-center">
        <img src="/icon/hashtag.svg" alt="#" className="w-3 h-3" />
      </div>
      <div className="text-center justify-start text-indigo-600 text-[10px] font-semibold font-sans">{label}</div>
    </div>
  );
}
