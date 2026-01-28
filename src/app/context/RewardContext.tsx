'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import RewardNotification from '../components/RewardNotification';

interface RewardData {
  gems?: number;
  exp?: number;
  currentExp?: number;
  expToNextLevel?: number;
  level?: number;
  message?: string;
}

interface RewardContextType {
  showReward: (reward: RewardData) => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export function RewardProvider({ children }: { children: ReactNode }) {
  const [reward, setReward] = useState<RewardData | null>(null);

  const showReward = (rewardData: RewardData) => {
    setReward(rewardData);
  };

  const handleClose = () => {
    setReward(null);
  };

  return (
    <RewardContext.Provider value={{ showReward }}>
      {children}
      {reward && <RewardNotification reward={reward} onClose={handleClose} />}
    </RewardContext.Provider>
  );
}

export function useReward() {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error('useReward must be used within RewardProvider');
  }
  return context;
}
