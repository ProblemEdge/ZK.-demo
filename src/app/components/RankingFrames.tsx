import React from 'react';

interface RankUserProps {
  name: string;
  username: string;
  level: number;
  avatarUrl?: string | null;
  className?: string;
  onClick?: () => void;
  rankingType?: 'level' | 'gems' | 'votes' | 'likes';
  score?: number;
}

const defaultAvatar = '/icon/profile_icon.svg';

export function RankFirstFrame({ name, username, level, avatarUrl, className = '', onClick, rankingType = 'level', score }: RankUserProps) {
  const displayValue = rankingType === 'level' ? `LV ${level}` : 
                       rankingType === 'gems' ? `${score || 0}` : 
                       rankingType === 'votes' ? `${score || 0}票` : 
                       `${score || 0}`;
  const valueColor = rankingType === 'level' ? 'text-[#ff6d00]' :
                     rankingType === 'gems' ? 'text-[#09ffe2]' :
                     rankingType === 'votes' ? 'text-[#00e676]' :
                     'text-[#ff73c7]';
  
  return (
    <div className={`flex flex-col items-center gap-[4px] ${className} cursor-pointer`} onClick={onClick}>
      <div className="bg-[#14161a] border border-white rounded-[8px] h-[148px] w-full px-[21px] py-[5px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-[3px] w-[106px]">
          <div className="flex flex-col items-center justify-center">
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-white flex-shrink-0">
              <img src={avatarUrl || defaultAvatar} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-center mt-[2px] w-full min-w-0">
              <div className="text-[20px] font-bold text-white text-center leading-[20px] w-full truncate px-1">
                {name}
              </div>
              <div className="text-[10px] text-[#bfbdbd] text-center leading-[15px] w-full truncate px-1">
                @{username}
              </div>
            </div>
          </div>
          <div className={`text-[20px] font-bold ${valueColor} text-center w-full`}>{displayValue}</div>
        </div>
      </div>
      <div className="text-[32px] font-bold text-[#ffc400] text-center w-full">1st</div>
    </div>
  );
}

export function RankSecondFrame({ name, username, level, avatarUrl, className = '', onClick, rankingType = 'level', score }: RankUserProps) {
  const displayValue = rankingType === 'level' ? `LV ${level}` : 
                       rankingType === 'gems' ? `${score || 0}` : 
                       rankingType === 'votes' ? `${score || 0}票` : 
                       `${score || 0}`;
  const valueColor = rankingType === 'level' ? 'text-[#ff6d00]' :
                     rankingType === 'gems' ? 'text-[#09ffe2]' :
                     rankingType === 'votes' ? 'text-[#00e676]' :
                     'text-[#ff73c7]';
  
  return (
    <div className={`flex flex-col items-center gap-[4px] ${className} cursor-pointer`} onClick={onClick}>
      <div className="bg-[#14161a] border border-white rounded-[8px] w-[148px] h-[128px] px-[16px] py-[5px] flex flex-col items-center justify-center gap-[4px]">
        <div className="flex flex-col items-center justify-center h-[85px] w-full min-w-0">
          <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-white flex-shrink-0">
            <img src={avatarUrl || defaultAvatar} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col items-center pt-[4px] w-full min-w-0">
            <div className="text-[16px] font-bold text-white text-center leading-[20px] w-full truncate px-1">
              {name}
            </div>
            <div className="text-[10px] text-[#bfbdbd] text-center leading-[15px] w-full truncate px-1">
              @{username}
            </div>
          </div>
        </div>
        <div className={`text-[16px] font-bold ${valueColor} text-center w-full`}>{displayValue}</div>
      </div>
      <div className="text-[24px] font-bold text-[#bfbdbd] text-center w-full">2st</div>
    </div>
  );
}

export function RankThirdFrame({ name, username, level, avatarUrl, className = '', onClick, rankingType = 'level', score }: RankUserProps) {
  const displayValue = rankingType === 'level' ? `LV ${level}` : 
                       rankingType === 'gems' ? `${score || 0}` : 
                       rankingType === 'votes' ? `${score || 0}票` : 
                       `${score || 0}`;
  const valueColor = rankingType === 'level' ? 'text-[#ff6d00]' :
                     rankingType === 'gems' ? 'text-[#09ffe2]' :
                     rankingType === 'votes' ? 'text-[#00e676]' :
                     'text-[#ff73c7]';
  
  return (
    <div className={`flex flex-col items-center gap-[4px] ${className} cursor-pointer`} onClick={onClick}>
      <div className="bg-[#14161a] border border-white rounded-[8px] w-[148px] h-[128px] px-[16px] py-[5px] flex flex-col items-center justify-center gap-[4px]">
        <div className="flex flex-col items-center justify-center h-[85px] w-full min-w-0">
          <div className="w-[60px] h-[60px] rounded-full overflow-hidden border border-white flex-shrink-0">
            <img src={avatarUrl || defaultAvatar} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col items-center pt-[4px] w-full min-w-0">
            <div className="text-[16px] font-bold text-white text-center leading-[20px] w-full truncate px-1">
              {name}
            </div>
            <div className="text-[10px] text-[#bfbdbd] text-center leading-[15px] w-full truncate px-1">
              @{username}
            </div>
          </div>
        </div>
        <div className={`text-[16px] font-bold ${valueColor} text-center w-full`}>{displayValue}</div>
      </div>
      <div className="text-[24px] font-bold text-[#ac4e08] text-center w-full">3st</div>
    </div>
  );
}

interface RankListFrameProps {
  rank: number;
  name: string;
  username: string;
  level: number;
  avatarUrl?: string | null;
  className?: string;
  onClick?: () => void;
  rankingType?: 'level' | 'gems' | 'votes' | 'likes';
  score?: number;
}

export function RankListFrame({ rank, name, username, level, avatarUrl, className = '', onClick, rankingType = 'level', score }: RankListFrameProps) {
  const displayValue = rankingType === 'level' ? `LV ${level}` : 
                       rankingType === 'gems' ? `${score || 0}` : 
                       rankingType === 'votes' ? `${score || 0}票` : 
                       `${score || 0}`;
  const valueColor = rankingType === 'level' ? 'text-[#ff6d00]' :
                     rankingType === 'gems' ? 'text-[#09ffe2]' :
                     rankingType === 'votes' ? 'text-[#00e676]' :
                     'text-[#ff73c7]';
  
  return (
    <div className={`bg-[#14161a] border border-white rounded-[8px] px-[13px] py-[7px] flex items-center gap-[12px] ${className} cursor-pointer`} onClick={onClick}>
      <div className="flex items-center gap-[10px] flex-1 min-w-0">
        <div className="text-[24px] font-bold text-white w-[49px] flex-shrink-0">{rank}st</div>
        <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-white flex-shrink-0">
          <img src={avatarUrl || defaultAvatar} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-[20px] font-bold text-white leading-[20px] truncate">
            {name}
          </div>
          <div className="text-[12px] text-[#bfbdbd] leading-[15px] truncate">
            @{username}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end w-[60px] flex-shrink-0">
        <div className={`text-[16px] font-bold ${valueColor} text-right w-full`}>{displayValue}</div>
      </div>
    </div>
  );
}
