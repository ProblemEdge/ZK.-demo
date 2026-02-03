import { useEffect } from 'react';
import { useReward } from '../../context/RewardContext';

/**
 * リワードチェックを管理するカスタムフック
 */
export const useRewardCheck = (status: string) => {
  const { showReward } = useReward();

  const checkRewards = async () => {
    try {
      const lastChecked = Number(localStorage.getItem('last_reward_check') || '0');
      if (Date.now() - lastChecked < 60000) return;
      localStorage.setItem('last_reward_check', Date.now().toString());

      const res = await fetch('/api/notifications/check-rewards', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasReward && data.reward) {
          showReward(data.reward);
        }
      }
    } catch (err) {
      console.error('Reward check error:', err);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    checkRewards();
  }, [status]);

  return { checkRewards };
};
