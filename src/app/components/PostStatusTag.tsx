import React from "react";

export type PostStatus = "voting" | "approved" | "rejected";

interface PostStatusTagProps {
  status: PostStatus;
}

export default function PostStatusTag({ status }: PostStatusTagProps) {
  let iconSrc = "";
  let alt = "";
  let bg = "";
  let outline = "";
  if (status === "approved") {
    iconSrc = "/icon/success.svg";
    alt = "承認済み";
    bg = "bg-emerald-500";
    outline = "outline outline-[3px] outline-offset-[-3px] outline-green-900";
  } else if (status === "rejected") {
    iconSrc = "/icon/disabled.svg";
    alt = "拒否された";
    bg = "bg-rose-600";
    outline = "outline outline-[3px] outline-offset-[-3px] outline-pink-950";
  } else {
    iconSrc = "/icon/voting.svg";
    alt = "投票受付中";
    bg = "bg-blue-500";
    outline = "outline outline-[3px] outline-offset-[-3px] outline-blue-900";
  }
  return (
    <div className={`w-16 h-8 opacity-80 rounded-[30px] flex items-center justify-center ${bg} ${outline}`}>
      <img src={iconSrc} alt={alt} className="w-6 h-6 object-contain" />
    </div>
  );
}
