import React from 'react';
import Badge from './Badge';

export interface BadgeData {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  imageUrl: string;
}

interface BadgesProps {
  badges: BadgeData[];
  size?: 'sm' | 'md' | 'lg';
}

export default function Badges({ badges, size = 'md' }: BadgesProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges.map((badge) => (
        <Badge
          key={badge.id}
          name={badge.name}
          displayName={badge.displayName}
          description={badge.description}
          imageUrl={badge.imageUrl}
          size={size}
        />
      ))}
    </div>
  );
}
