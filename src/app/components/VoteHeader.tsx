'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function VoteHeader() {
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
    <div className="bg-[#0b0c0f] border-b-4 border-white px-4 h-[65px] grid grid-cols-3 items-center">
      <Link href="/feed" onClick={handleLogoClick} className="text-white text-[32px] font-bold cursor-pointer hover:opacity-80 transition">ZK.</Link>
      <div className="text-white text-[32px] font-bold text-center">投票</div>
      <div className="flex justify-end">
        <Link href="/notifications" className="flex items-center justify-center p-0.5 w-7 h-7 rounded-[32px] bg-[#475467]">
          <img src="/icon/Bell.svg" alt="通知" className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
