import React from "react";

export type RangeScope = "friend" | "global";

interface RangeTagProps {
  scope: RangeScope;
  size?: number; // px
}

export default function RangeTag({ scope, size = 24 }: RangeTagProps) {
  const iconSrc = scope === "friend" ? "/icon/range_tag_friend.svg" : "/icon/range_tag_global.svg";
  const alt = scope === "friend" ? "友達に公開" : "全体に公開";

  const style: React.CSSProperties = {
    width: size,
    height: size,
  };

  return <img src={iconSrc} alt={alt} style={style} className="object-contain" />;
}
