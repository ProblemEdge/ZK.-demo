'use client';

import { useEffect, useState } from 'react';

interface RewardData {
  gems?: number;
  gemsBefore?: number;
  gemsAfter?: number;
  exp?: number;
  currentExp?: number;
  currentExpAfter?: number;
  expToNextLevel?: number;
  level?: number;
  message?: string;
}

interface RewardNotificationProps {
  onClose: () => void;
  reward: RewardData;
}

export default function RewardNotification({ onClose, reward }: RewardNotificationProps) {
  const [show, setShow] = useState(false);
  const [animatedGems, setAnimatedGems] = useState(reward.gemsBefore ?? 0);
  const [animatedExp, setAnimatedExp] = useState(reward.currentExp ?? 0);

  useEffect(() => {
    // スライドインアニメーション
    setTimeout(() => setShow(true), 10);

    // ジェムのカウントアップアニメーション（開始値から終了値へ）
    if (reward.gems && reward.gems > 0 && reward.gemsBefore !== undefined && reward.gemsAfter !== undefined) {
      let current = reward.gemsBefore;
      const targetGems = reward.gemsAfter;
      const increment = Math.ceil((targetGems - reward.gemsBefore) / 30);
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetGems) {
          setAnimatedGems(targetGems);
          clearInterval(timer);
        } else {
          setAnimatedGems(current);
        }
      }, 30);
    } else if (reward.gems && reward.gems > 0) {
      // フォールバック：gemsAfterがない場合は従来の方式
      setAnimatedGems(reward.gems);
    }

    // XPのカウントアップアニメーション（開始値から終了値へ）
    if (reward.exp && reward.exp > 0 && reward.currentExp !== undefined && reward.currentExpAfter !== undefined) {
      let current = reward.currentExp;
      const targetExp = reward.currentExpAfter;
      const increment = Math.ceil((targetExp - reward.currentExp) / 40);
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetExp) {
          setAnimatedExp(targetExp);
          clearInterval(timer);
        } else {
          setAnimatedExp(current);
        }
      }, 25);
    } else if (reward.exp && reward.exp > 0 && reward.currentExpAfter !== undefined) {
      // フォールバック
      setAnimatedExp(reward.currentExpAfter);
    }

    // 3秒後に自動的に閉じる
    const closeTimer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(closeTimer);
  }, [reward, onClose]);

  const expPercentage = reward.expToNextLevel
    ? Math.min((animatedExp / reward.expToNextLevel) * 100, 100)
    : 0;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] transition-all duration-300 ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 p-4 max-w-sm">
        {/* メッセージ */}
        {reward.message && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-100">{reward.message}</p>
          </div>
        )}

        {/* 報酬内容 */}
        <div className="space-y-2">
          {/* ジェム表示 */}
          {reward.gems !== undefined && reward.gems > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">💎 ジェム</span>
              <span className="font-bold text-yellow-500">
                {reward.gemsBefore !== undefined ? `${reward.gemsBefore} → ${animatedGems}` : `+${animatedGems}`}
              </span>
            </div>
          )}

          {/* XP表示 */}
          {reward.exp !== undefined && reward.exp > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">⭐ 経験値</span>
              <span className="font-bold text-blue-400">+{reward.exp}</span>
            </div>
          )}

          {/* XPプログレスバー */}
          {reward.expToNextLevel && reward.exp && reward.exp > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-700">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Lv. {reward.level}</span>
                <span>{animatedExp}/{reward.expToNextLevel}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${expPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
