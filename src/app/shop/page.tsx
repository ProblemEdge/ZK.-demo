import Link from 'next/link';

export default function ShopPlaceholder() {
  return (
    <div
      className='min-h-screen bg-gradient-to-b from-[#0b0c0f] via-[#0b0c0f] to-[#0f0f0f] pb-24'
      style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}
    >
      <div className='max-w-3xl mx-auto px-4 py-20 text-center'>
        <img src='/icon/Shopping_cart.svg' alt='Shop' className='mx-auto w-20 h-20 mb-6' />
        <h1 className='text-3xl md:text-4xl font-extrabold text-white mb-4'>
          ショップは準備中です
        </h1>
        <p className='text-gray-300 text-lg md:text-xl mb-6'>
          この機能は現在開発中です。近日中に実装予定です。お楽しみに！
        </p>
        <div className='flex justify-center gap-4'>
          <Link href='/' className='px-4 py-2 bg-white text-black rounded-lg font-medium'>
            ホームへ戻る
          </Link>
          <Link
            href='/profile'
            className='px-4 py-2 border border-white text-white rounded-lg font-medium'
          >
            プロフィールへ
          </Link>
        </div>
        <p className='text-xs text-gray-500 mt-8'>
          開発チーム: 実装予定のアイテムはジェムや限定バッジなどを想定しています。
        </p>
      </div>
    </div>
  );
}
