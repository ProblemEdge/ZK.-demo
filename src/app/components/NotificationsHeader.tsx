'use client';

export default function NotificationsHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0b0c0f] border-b-4 border-white px-4 h-[65px] grid grid-cols-3 items-center">
      <div className="text-white text-[32px] font-bold">ZK.</div>
      <div className="text-white text-[32px] font-bold text-center">通知</div>
      <div className="w-7 h-7 justify-self-end" />
    </header>
  );
}
