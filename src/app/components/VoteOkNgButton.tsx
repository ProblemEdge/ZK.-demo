import React from "react";

export function VoteOkButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="bg-[#00e676] border-[3px] border-[#065512] opacity-90 px-[20px] py-[4px] rounded-[12px] flex items-center justify-center focus:outline-none"
      {...props}
    >
      <span className="font-bold text-[24px] text-center text-white font-sans">OK</span>
    </button>
  );
}

export function VoteNgButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="bg-[#ff1744] border-[3px] border-[#550606] opacity-90 px-[20px] py-[4px] rounded-[12px] flex items-center justify-center focus:outline-none"
      {...props}
    >
      <span className="font-bold text-[24px] text-center text-white font-sans">NG</span>
    </button>
  );
}
