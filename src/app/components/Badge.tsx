import React from 'react';

interface BadgeProps {
  name: string;
  imageUrl: string;
  displayName?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10'
};

export default function Badge({ 
  name, 
  imageUrl, 
  displayName, 
  description,
  size = 'md' 
}: BadgeProps) {
  return (
    <div className="group relative">
      <img
        src={imageUrl}
        alt={displayName || name}
        title={displayName || name}
        className={`${sizeClasses[size]} rounded-full border border-white/30 hover:border-white/80 transition cursor-help`}
      />
      
      {/* ツールチップ */}
      {(displayName || description) && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-[#1d1e21] rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 border border-white/20">
          <div className="font-bold">{displayName || name}</div>
          {description && (
            <div className="text-[#bfbdbd] text-[10px] mt-1">{description}</div>
          )}
        </div>
      )}
    </div>
  );
}
