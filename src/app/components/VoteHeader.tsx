'use client';

import Link from 'next/link';

export default function VoteHeader() {
  return (
    <div className="bg-[#0b0c0f] border-b-4 border-white px-4 h-[65px] grid grid-cols-3 items-center">
      <div className="text-white text-[32px] font-bold">ZK.</div>
      <div className="text-white text-[32px] font-bold text-center">投票</div>
      <div className="flex justify-end">
        <Link href="/notifications" className="flex items-center justify-center p-0.5 w-7 h-7 rounded-[32px] bg-[#475467]">
          <img src="/icon/Bell.svg" alt="通知" className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
