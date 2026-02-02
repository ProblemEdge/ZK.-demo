'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function NotificationsHeader() {
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
    <header className="sticky top-0 z-50 bg-[#0b0c0f] border-b-4 border-white px-4 h-[65px] grid grid-cols-3 items-center">
      <Link href="/feed" onClick={handleLogoClick} className="text-white text-[32px] font-bold cursor-pointer hover:opacity-80 transition">ZK.</Link>
      <div className="text-white text-[32px] font-bold text-center">通知</div>
      <div className="w-7 h-7 justify-self-end" />
    </header>
  );
}
