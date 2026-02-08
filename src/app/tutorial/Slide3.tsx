'use client';

export default function Slide3() {
  return (
    <section className='w-full min-h-[55vh] md:min-h-[65vh] flex flex-col items-center gap-10 md:gap-12 px-6 py-8'>
      {/* タイトル */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <div className='flex items-center justify-center gap-2 whitespace-nowrap'>
          <h1 className='text-4xl md:text-5xl font-extrabold leading-tight'>もっと</h1>
          <img
            src='/icon_only_text.svg'
            alt='ZK.'
            className='h-10 md:h-14 w-auto translate-y-0.5'
          />
          <h1 className='text-4xl md:text-5xl font-extrabold leading-tight'>を</h1>
        </div>
        <h2 className='text-3xl md:text-4xl font-extrabold leading-tight'>楽しもう</h2>
      </div>

      {/* 機能一覧 */}
      <div className='w-full max-w-4xl flex flex-col gap-6 md:gap-8'>
        {/* ランキング */}
        <div className='flex items-start gap-6 md:gap-12'>
          <div className='w-20 text-right'>
            <div className='text-2xl md:text-3xl font-black text-white/90'>RANK</div>
          </div>
          <div className='flex-1'>
            <h3 className='text-lg md:text-xl font-bold'>ランキング</h3>
            <p className='mt-1 text-sm md:text-base text-[#D1D5DB] leading-relaxed'>
              みんなの評価で順位が決まります。人気を集めてトップを目指そう。
            </p>
          </div>
        </div>

        {/* クエスト */}
        <div className='flex items-start gap-6 md:gap-12'>
          <div className='w-20 text-right'>
            <div className='text-2xl md:text-3xl font-black text-white/90'>QUEST</div>
          </div>
          <div className='flex-1'>
            <h3 className='text-lg md:text-xl font-bold'>クエスト</h3>
            <p className='mt-1 text-sm md:text-base text-[#D1D5DB] leading-relaxed'>
              毎日のお題に挑戦して、投稿で大量のXPを獲得しよう。
            </p>
          </div>
        </div>

        {/* レベル */}
        <div className='flex items-start gap-6 md:gap-12'>
          <div className='w-20 text-right'>
            <div className='text-2xl md:text-3xl font-black text-white/90'>LEVEL</div>
          </div>
          <div className='flex-1'>
            <h3 className='text-lg md:text-xl font-bold'>レベル</h3>
            <p className='mt-1 text-sm md:text-base text-[#D1D5DB] leading-relaxed'>
              活動でXPをためてレベルアップ。特典をアンロックしよう。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
