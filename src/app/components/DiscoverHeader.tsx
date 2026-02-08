'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface DiscoverHeaderProps {
  mainTab: 'search' | 'ranking';
}

export default function DiscoverHeader({ mainTab }: DiscoverHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/feed') {
      e.preventDefault();
      router.refresh();
      window.location.reload();
    }
  };

  return (
    <div className='sticky top-0 z-50 px-4 h-[65px] border-b-4 border-white relative flex items-center bg-[#0b0c0f]'>
      <Link
        href='/feed'
        onClick={handleLogoClick}
        className='flex items-center h-full cursor-pointer hover:opacity-80 transition'
      >
        <img
          src='/icon_only_text.svg'
          alt='ZK Logo'
          className='h-7 w-auto'
          style={{ maxWidth: 90 }}
        />
      </Link>
      <div className='absolute left-1/2 -translate-x-1/2 text-white text-[32px] font-bold whitespace-nowrap'>
        {mainTab === 'search' ? '人々' : 'ランキング'}
      </div>
      <button
        type='button'
        className='ml-auto w-7 h-7 flex items-center justify-center bg-[#475467] rounded-full'
        onClick={() => router.push('/notifications')}
      >
        <img src='/icon/Bell.svg' alt='通知' className='w-6 h-6' />
      </button>
    </div>
  );
}
