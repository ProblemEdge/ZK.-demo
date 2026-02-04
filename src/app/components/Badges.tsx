import React from 'react';
import Badge from './Badge';
import type { UserBadge } from '@/domains/badges/schema';

export interface BadgeData {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  imageUrl: string;
}

interface BadgesProps {
  badges: BadgeData[] | UserBadge[];
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
          description={badge.description ?? undefined}
          imageUrl={badge.imageUrl}
          size={size}
        />
      ))}
    </div>
  );
}
