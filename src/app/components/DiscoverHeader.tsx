'use client';

import { useRouter } from 'next/navigation';

interface DiscoverHeaderProps {
  mainTab: 'search' | 'ranking';
}

export default function DiscoverHeader({ mainTab }: DiscoverHeaderProps) {
  const router = useRouter();

  return (
    <div className="px-4 h-[65px] border-b-4 border-white relative flex items-center">
      <div className="text-white text-[32px] font-bold">ZK.</div>
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
