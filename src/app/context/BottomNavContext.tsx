"use client";

import React, { createContext, useContext, useState } from 'react';

type BottomNavContextValue = {
  visible: boolean;
  setVisible: (v: boolean) => void;
};

const BottomNavContext = createContext<BottomNavContextValue | undefined>(undefined);

export function BottomNavProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  return <BottomNavContext.Provider value={{ visible, setVisible }}>{children}</BottomNavContext.Provider>;
}

export function useBottomNav() {
  const ctx = useContext(BottomNavContext);
  if (!ctx) throw new Error('useBottomNav must be used within BottomNavProvider');
  return ctx;
}

export default BottomNavContext;
