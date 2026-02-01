import React from "react";

// ラベルの種類
export type VoteStatusType = "question" | "ultimate" | "perfect" | "success";

interface VoteStatusLabelProps {
  type: VoteStatusType;
  percent?: number; // success用: 承認率（0-100）
  approvedCount?: number; // success用: 承認数
  rejectedCount?: number; // success用: 否定数
}

export default function VoteStatusLabel({ type, percent, approvedCount, rejectedCount }: VoteStatusLabelProps) {
  // アイコンとラベル色・背景色を状態ごとに切り替え
  if (type === "question") {
    // 投票前: テキストなし、アイコン中央
    return (
      <div className="flex items-center justify-center px-3 py-1 rounded-full bg-gray-800/80 border border-gray-600 min-w-[80px] min-h-[28px]">
        <img src="/icon/question.svg" alt="?" className="w-4 h-4 mx-auto" />
      </div>
    );
  }
  if (type === "ultimate") {
    // 投票10個かつ100%
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-blue-900" style={{background: 'linear-gradient(180deg, #FF00E5 0%, #00F6FF 100%)'}}>
        <img src="/icon/Award_ult.svg" alt="アルティメット" className="w-4 h-4" />
        <span className="text-white text-xs font-bold min-w-[80px] text-center font-sans">アルティメット</span>
      </div>
    );
  }
  if (type === "perfect") {
    // 承認100%
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-yellow-600" style={{background: 'linear-gradient(180deg, #e27b06 0%, #dbbb04 100%)'}}>
        <img src="/icon/Star.svg" alt="パーフェクト" className="w-4 h-4" />
        <span className="text-white text-xs font-bold min-w-[80px] text-center font-sans">パーフェクト！</span>
      </div>
    );
  }
  // Figma準拠: approvedCount/rejectedCountからゲージ幅を自動計算
  const approved = typeof approvedCount === 'number' ? approvedCount : 0;
  const rejected = typeof rejectedCount === 'number' ? rejectedCount : 0;
  const total = approved + rejected;
  // ゲージ全体幅（px）
  const gaugeTotal = 135 - 4; // 2px padding左右
  // 承認・否定の幅を数値比率で決定
  let approvedWidth = gaugeTotal / 2;
  let rejectedWidth = gaugeTotal / 2;
  
  if (total > 0) {
    if (approved === 0) {
      approvedWidth = 0;
      rejectedWidth = gaugeTotal;
    } else if (rejected === 0) {
      approvedWidth = gaugeTotal;
      rejectedWidth = 0;
    } else {
      approvedWidth = (gaugeTotal * approved) / total;
      rejectedWidth = (gaugeTotal * rejected) / total;
    }
  }
  
  // 否定側のleft位置（右端からrejectedWidth分引く）
  const rejectedLeft = 2 + gaugeTotal - rejectedWidth;
  // ラベル位置は常に固定
  const approvedLabelLeft = 10;
  const rejectedLabelLeft = 88;
  return (
    <div className="w-[135px] h-8 relative rounded-[32px] outline outline-2 outline-offset-[-2px] outline-white">
      {total === 0 ? (
        <div className="absolute left-[2px] top-[2px] h-7 w-[131px] rounded-[32px] bg-white/10" />
      ) : (
        <>
          {/* 左側（承認）背景 */}
          <div 
            className={`h-7 left-[2px] top-[2px] absolute ${rejected === 0 ? 'rounded-[32px]' : 'rounded-tl-[32px] rounded-bl-[32px]'}`}
            style={{width: approvedWidth, background: '#00e676'}} 
          />
          {/* 右側（否定）背景: 右端のみ角丸 */}
          <div 
            className={`h-7 absolute ${approved === 0 ? 'rounded-[32px]' : 'rounded-tr-[32px] rounded-br-[32px]'}`}
            style={{width: rejectedWidth, left: rejectedLeft, top: 2, background: '#FF1744'}} 
          />
        </>
      )}
      {/* 承認アイコン＋数値（常に固定位置） */}
      <div className="absolute inline-flex justify-start items-center gap-[5px]" style={{left: approvedLabelLeft, top: 6}}>
        <img src="/icon/abled_icon.svg" alt="承認" className="w-5 h-5" />
        <span className="text-white text-sm font-bold font-sans text-center">{approved}</span>
      </div>
      {/* 否定アイコン＋数値（常に固定位置） */}
      <div className="absolute inline-flex justify-start items-center gap-1.5" style={{left: rejectedLabelLeft, top: 6}}>
        <img src="/icon/disabled_cir.svg" alt="否定" className="w-5 h-5" />
        <span className="text-white text-sm font-bold font-sans text-center">{rejected}</span>
      </div>
    </div>
  );
}
