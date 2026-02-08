'use client';

export default function Slide1() {
  return (
    <section className='w-full h-[60vh] md:h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center pt-48'>
      <div className='flex flex-col items-center gap-4'>
        <h1 className='text-6xl md:text-6xl font-extrabold whitespace-nowrap'>いますぐ</h1>
        <div className='flex items-center gap-4 justify-center'>
          <img src='/icon_only_text.svg' alt='ZK' className='h-12 md:h-16 w-auto inline-block' />
          <span className='text-6xl md:text-6xl font-extrabold'>で</span>
        </div>
        <h1 className='text-4xl md:text-6xl font-extrabold whitespace-nowrap'>
          あなただけの
          <br />
          松本を共有しましょう
        </h1>
      </div>
    </section>
  );
}
