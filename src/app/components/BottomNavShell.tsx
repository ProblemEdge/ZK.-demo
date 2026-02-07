"use client";

import React from 'react';
import BottomNav from './BottomNav';
import { useBottomNav } from '@/app/context/BottomNavContext';

export default function BottomNavShell() {
  const { visible } = useBottomNav();
  if (!visible) return null;
  return <BottomNav />;
}
