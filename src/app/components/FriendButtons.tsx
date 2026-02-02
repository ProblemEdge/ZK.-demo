'use client';

interface FriendButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

// friend_add: フレンドじゃないユーザーに表示される追加ボタン
export function FriendAddButton({ onClick, disabled }: FriendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#475467] border border-white rounded-[32px] px-[9px] py-[7px] flex items-center gap-[2px] hover:bg-[#556578] transition disabled:opacity-50"
    >
      <span className="font-bold text-[15px] text-white">追加</span>
      <img src="/icon/User plus.svg" alt="追加" className="w-5 h-5" />
    </button>
  );
}

// Frending: フレンドの間のボタン、ホバーすると「削除」に変わる
interface FriendingButtonProps extends FriendButtonProps {
  isHovered?: boolean;
}

export function FriendingButton({ onClick, disabled, isHovered }: FriendingButtonProps) {
  if (isHovered) {
    // ホバー時は削除ボタンに切り替わる
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="bg-[#ff1744] border border-white rounded-[32px] px-[9px] py-[7px] flex items-center gap-[2px] transition disabled:opacity-50"
      >
        <span className="font-bold text-[15px] text-white">削除</span>
        <img src="/icon/Users.svg" alt="削除" className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#00e676] border border-[#0e3f10] rounded-[32px] px-[9px] py-[7px] flex items-center gap-[2px] hover:bg-[#00d664] transition disabled:opacity-50"
    >
      <span className="font-bold text-[15px] text-white">承認</span>
      <img src="/icon/User plus.svg" alt="承認" className="w-5 h-5" />
    </button>
  );
}

// friend_reqing: フレンドリクエスト中にリクエストを削除できる
export function FriendReqingButton({ onClick, disabled }: FriendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#ff1744] border border-white rounded-[32px] px-[9px] py-[7px] hover:bg-[#dd1144] transition disabled:opacity-50"
    >
      <span className="font-bold text-[15px] text-white">取り消し</span>
    </button>
  );
}

// friend_req: フレンドを承認するか拒否するかリクエストされたときに選択できるボタン（拒否）
export function FriendRejectButton({ onClick, disabled }: FriendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#ff1744] border border-white rounded-[32px] px-[9px] py-[7px] flex items-center gap-[2px] hover:bg-[#dd1144] transition disabled:opacity-50"
    >
      <span className="font-bold text-[15px] text-white">拒否</span>
      <img src="/icon/User check_16.svg" alt="拒否" className="w-5 h-5" />
    </button>
  );
}

// Frending/friend_req: フレンドを承認するボタン（承認）
export function FriendAcceptButton({ onClick, disabled }: FriendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-[#00e676] border border-[#0e3f10] rounded-[32px] px-[9px] py-[7px] flex items-center gap-[2px] hover:bg-[#00d664] transition disabled:opacity-50"
    >
      <span className="font-bold text-[15px] text-white">承認</span>
      <img src="/icon/User plus.svg" alt="承認" className="w-5 h-5" />
    </button>
  );
}
