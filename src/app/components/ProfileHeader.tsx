'use client';

import { useRouter } from 'next/navigation';

export default function ProfileHeader() {
  const router = useRouter();

  return (
    <header className="bg-[#0b0c0f] border-b-4 border-white h-[65px] sticky top-0 z-50 flex items-center justify-between px-4">
      <p className="text-2xl font-bold text-white">ZK.</p>
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
