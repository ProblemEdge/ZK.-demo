'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ProfileHeader() {
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
    <header className="bg-[#0b0c0f] border-b-4 border-white h-[65px] sticky top-0 z-50 flex items-center justify-between px-4">
      <Link href="/feed" onClick={handleLogoClick} className="flex items-center h-full cursor-pointer hover:opacity-80 transition">
        <img src="/icon_only_text.svg" alt="ZK Logo" className="h-7 w-auto" style={{ maxWidth: 90 }} />
      </Link>
      <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-white">プロフィール</h1>
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center bg-[#475467] rounded-full"
        onClick={() => router.push('/notifications')}
      >
        <img src="/icon/Bell.svg" alt="通知" className="w-6 h-6" />
      </button>
    </header>
  );
}
