import React from 'react';

export type FriendStatus = 'add' | 'pending' | 'received' | 'friend';

interface FriendStatusButtonProps {
  status: FriendStatus;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const STATUS_STYLES: Record<FriendStatus, { label: string; className: string; icon?: string }> = {
  add: {
    label: '友達申請',
    className: 'bg-[#00e676] hover:bg-[#00d664] border-2 border-white',
    icon: '➕'
  },
  pending: {
    label: '申請中',
    className: 'bg-[#475467] hover:bg-[#556578] border-2 border-white opacity-70',
    icon: '⏳'
  },
  received: {
    label: '承認する',
    className: 'bg-[#ffc107] hover:bg-[#ffb300] border-2 border-white animate-pulse',
    icon: '✅'
  },
  friend: {
    label: '友達',
    className: 'bg-[#00e676] border-2 border-white',
    icon: '✓'
  }
};

export default function FriendStatusButton({ status, onClick, className = '' }: FriendStatusButtonProps) {
  const { label, className: statusClassName, icon } = STATUS_STYLES[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 h-[36px] px-4 rounded-full ${statusClassName} ${className} transition-all font-bold shadow-lg`}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="text-sm text-white leading-none whitespace-nowrap">{label}</span>
    </button>
  );
}
