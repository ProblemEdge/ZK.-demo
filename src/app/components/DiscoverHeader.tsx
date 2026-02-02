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
    <div className="px-4 h-[65px] border-b-4 border-white relative flex items-center">
      <Link href="/feed" onClick={handleLogoClick} className="text-white text-[32px] font-bold cursor-pointer hover:opacity-80 transition">ZK.</Link>
      <div className="absolute left-1/2 -translate-x-1/2 text-white text-[32px] font-bold whitespace-nowrap">
        {mainTab === 'search' ? '人々' : 'ランキング'}
      </div>
      <button
        type="button"
        className="ml-auto w-7 h-7 flex items-center justify-center bg-[#475467] rounded-full"
        onClick={() => router.push('/notifications')}
      >
        <img src="/icon/Bell.svg" alt="通知" className="w-6 h-6" />
      </button>
    </div>
  );
}
