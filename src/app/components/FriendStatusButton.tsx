import React from 'react';

export type FriendStatus = 'add' | 'pending' | 'friend';

interface FriendStatusButtonProps {
  status: FriendStatus;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const STATUS_STYLES: Record<FriendStatus, { label: string; className: string }> = {
  add: {
    label: '追加',
    className: 'bg-[#475467] border border-white'
  },
  pending: {
    label: '申請中',
    className: 'bg-[#14161a] border border-white'
  },
  friend: {
    label: '友達',
    className: 'bg-[#00e676] border border-[#0e3f10]'
  }
};

export default function FriendStatusButton({ status, onClick, className = '' }: FriendStatusButtonProps) {
  const { label, className: statusClassName } = STATUS_STYLES[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center h-[32px] px-[9px] rounded-[32px] ${statusClassName} ${className}`}
    >
      <span className="text-[15px] font-bold text-white leading-none whitespace-nowrap">{label}</span>
    </button>
  );
}
