"use client";

import { useEffect, useState } from 'react';

export default function Splash({ duration = 1200 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // セッション単位で一度だけ表示
    try {
      const seen = sessionStorage.getItem('splashSeen');
      if (seen) {
        setVisible(false);
        return;
      }
    } catch (e) {
      // ignore
    }

    const t = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem('splashSeen', '1'); } catch (e) {}
    }, duration);

    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
      <div className="flex items-center justify-center p-6 animate-fade">
        <img src="/icon_only_text.svg" alt="ZK" className="w-[220px] h-auto" />
      </div>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.98); }
          10% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.02); }
        }
        .animate-fade { animation: fadeInOut ${duration}ms ease-in-out both; }
      `}</style>
    </div>
  );
}
