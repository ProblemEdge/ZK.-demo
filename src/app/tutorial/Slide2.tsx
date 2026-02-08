"use client";

export default function Slide2() {
  return (
    <section className="w-full h-[60vh] md:h-[70vh] flex flex-col items-center gap-16 px-4 text-center whitespace-nowrap">
      
      {/* タイトル */}
      <div className="flex items-center gap-4 justify-center -translate-x-2 md:-translate-x-3">
        <h1 className="text-5xl md:text-6xl font-extrabold">HOW TO</h1>
        <img src="/icon_only_text.svg" alt="ZK" className="h-12 md:h-16 w-auto" />
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-24">

        {/* 1: 共有（右寄せ） */}
<div className="self-end w-full md:w-2/3 flex justify-end ">
<div className="flex flex-col items-end translate-x-8 translate-y-3 gap-1">

  {/* タイトル＋赤ライン */}
<div className="flex items-stretch gap-4">
  <h3 className="text-4xl md:text-3xl font-bold text-right leading-tight">
    あなたの<span className="text-cyan-400">松本</span>を<br />
    <span className="text-yellow-400">共有</span>しよう
  </h3>

  <div
    className="w-[12px] min-w-[12px] self-stretch bg-[#FF1744]"
    aria-hidden="true"
  />
</div>


  {/* 説明文（赤ラインに影響しない） */}
  <p className="mt-2 text-[1.2rem] text-[#D1D5DB] font-medium text-right mr-12">
    松本に関係している<br />
    自然や建物を<br />
    撮影して投稿しよう
  </p>

</div>
        </div>

{/* 2: 投票（左寄せ） */}
<div className="self-start w-full md:w-2/3">
  <div className="flex flex-col items-start translate-y-3 -translate-x-8 gap-1">

    {/* 赤ライン＋タイトル */}
    <div className="flex items-stretch gap-4">
      <div
        className="w-[12px] min-w-[12px] self-stretch bg-[#FF1744]"
        aria-hidden="true"
      />

      <h3 className="text-4xl md:text-3xl font-bold text-left leading-tight">
        みんなの<span className="text-cyan-400">松本</span>に<br />
        <span className="text-cyan-400">投票</span>しよう
      </h3>
    </div>

    <p className="mt-2 text-[1.2rem] text-[#D1D5DB] font-medium text-left ml-12">
      友達が投稿した写真が<br />
      松本に関係あるか投票しよう
    </p>

  </div>
</div>


      </div>
    </section>
  );
}
