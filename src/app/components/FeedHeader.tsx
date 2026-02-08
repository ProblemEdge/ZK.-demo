'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface FeedHeaderProps {
  tab: 'all' | 'following';
  viewTab: 'feed' | 'map';
  onTabChange: (tab: 'all' | 'following') => void;
  onViewTabChange: (viewTab: 'feed' | 'map') => void;
}

export default function FeedHeader({
  tab,
  viewTab,
  onTabChange,
  onViewTabChange,
}: FeedHeaderProps) {
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
    <div className='sticky top-0 z-50 bg-[#0b0c0f] border-b-4 border-white px-4 h-[65px] flex items-center justify-between'>
      {/* ロゴ */}
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

      {/* 右側のボタン群 */}
      <div className='flex items-center gap-2'>
        {/* 友達/すべて切り替え */}
        <div className='flex items-center gap-2'>
          <button
            onClick={() => {
              onViewTabChange('feed');
              onTabChange('following');
            }}
            className={`flex items-center gap-1 px-[6px] py-1 h-7 rounded-[16px] text-white text-[12px] font-bold transition ${
              viewTab === 'feed' && tab === 'following' ? 'bg-[#00e676]' : 'bg-[#475467]'
            }`}
          >
            <img src='/icon/User check.svg' alt='' className='w-5 h-5' />
            <span>友達</span>
          </button>
          <button
            onClick={() => {
              onViewTabChange('feed');
              onTabChange('all');
            }}
            className={`flex items-center gap-1.5 px-[7px] py-1 h-7 rounded-[16px] text-white text-[12px] font-bold transition ${
              viewTab === 'feed' && tab === 'all' ? 'bg-[#00e676]' : 'bg-[#475467]'
            }`}
          >
            <img src='/icon/Globe.svg' alt='' className='w-5 h-5' />
            <span>すべて</span>
          </button>
        </div>

        {/* マップトグル */}
        <button
          onClick={() => onViewTabChange('map')}
          className={`flex items-center justify-center p-1 w-7 h-7 rounded-[8px] transition ${
            viewTab === 'map' ? 'bg-[#00e676]' : 'bg-[#475467]'
          }`}
        >
          <img src='/icon/Map.svg' alt='マップ' className='w-5 h-5' />
        </button>

        {/* 通知 */}
        <Link
          href='/notifications'
          className='flex items-center justify-center p-0.5 w-7 h-7 rounded-[32px] bg-[#475467]'
        >
          <img src='/icon/Bell.svg' alt='通知' className='w-6 h-6' />
        </Link>
      </div>
    </div>
  );
}
