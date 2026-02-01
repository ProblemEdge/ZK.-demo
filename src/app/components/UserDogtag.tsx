import React from 'react';
import FriendStatusButton, { FriendStatus } from './FriendStatusButton';

interface UserDogtagProps {
  name: string;
  username: string;
  level: number;
  gems: number;
  posts: number;
  friends: number;
  status: FriendStatus;
  avatarUrl?: string | null;
  onStatusClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const defaultAvatar = '/icon/profile_icon.svg';

export default function UserDogtag({
  name,
  username,
  level,
  gems,
  posts,
  friends,
  status,
  avatarUrl,
  onStatusClick
}: UserDogtagProps) {
  const buttonSizeClass = status === 'pending' ? 'h-[32px] w-[64px]' : 'h-[32px] w-[48px]';

  return (
    <div className="bg-[#14161a] border border-white rounded-[8px] px-[13px] py-[7px] flex items-center gap-[17px] w-full">
      <div className="flex items-center gap-[10px] flex-1 min-w-0">
        <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-white/20">
          <img
            src={avatarUrl || defaultAvatar}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-[4px] w-[221px] min-w-0">
          <div className="flex flex-col">
            <div className="text-white text-[20px] font-bold leading-[20px]">
              {name}
            </div>
            <div className="text-[#bfbdbd] text-[12px] leading-[15px]">
              @{username}
            </div>
          </div>
          <div className="flex items-center gap-[4px] text-[#bfbdbd] text-[10px] whitespace-nowrap">
            <span>レベル {level}</span>
            <span>ジェム {gems}</span>
            <span>投稿 {posts}</span>
            <span>友達 {friends}</span>
          </div>
        </div>
      </div>
      <FriendStatusButton status={status} onClick={onStatusClick} className={`ml-auto ${buttonSizeClass}`} />
    </div>
  );
}
