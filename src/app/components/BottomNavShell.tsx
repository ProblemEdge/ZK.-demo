'use client';

import React from 'react';
import BottomNav from './BottomNav';
import { useBottomNav } from '@/app/context/BottomNavContext';
import { usePathname } from 'next/navigation';

export default function BottomNavShell() {
  const { visible } = useBottomNav();
  const pathname = usePathname();

  // Hide bottom nav on install page (and any nested install paths)
  if (pathname?.startsWith('/install')) return null;
  if (!visible) return null;
  return <BottomNav />;
}
