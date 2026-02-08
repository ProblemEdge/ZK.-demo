'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InstallClient() {
  const params = useSearchParams();
  const returnTo = params?.get('returnTo') || '/';

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      document.cookie = 'pwa_installed=1; path=/; max-age=31536000';
      window.location.href = returnTo;
    }
  }, [returnTo]);

  const markInstalled = () => {
    document.cookie = 'pwa_installed=1; path=/; max-age=31536000';
    window.location.href = returnTo;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>アプリをインストールしてください</h1>
      <p>
        モバイルでアクセスされています。ホーム画面に追加（インストール）してからご利用ください。
      </p>
      <ol>
        <li>ブラウザのメニューを開く</li>
        <li>「ホーム画面に追加」または「Add to Home screen」を選択</li>
        <li>インストール後、自動で戻らない場合は下のボタンを押してください。</li>
      </ol>
      <button onClick={markInstalled}>インストール済み — 開く</button>
    </div>
  );
}
