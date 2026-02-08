'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export default function InstallClient() {
  const params = useSearchParams();
  const returnTo = params?.get('returnTo') || '/';

  useEffect(() => {
    const nav = window.navigator as NavigatorWithStandalone;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
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
    <div className='min-h-screen w-full bg-gradient-to-b from-[#0b0c0f] to-[#0f0f0f] flex items-center justify-center p-6'>
      <div className='max-w-md w-full'>
        {/* アイコン・ヘッダー */}
        <div className='flex flex-col items-center gap-6 mb-8'>
          <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00a63e] to-[#13ac4c] flex items-center justify-center shadow-lg shadow-green-900/40'>
            <svg
              className='w-10 h-10 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </div>

          <div className='text-center'>
            <h1 className='text-3xl md:text-4xl font-extrabold text-white mb-3'>
              アプリをインストール
            </h1>
            <p className='text-gray-400 text-sm md:text-base leading-relaxed'>
              ホーム画面に追加して
              <br />
              快適に利用しましょう
            </p>
          </div>
        </div>

        {/* インストール手順 */}
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-start gap-4'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#00a63e] to-[#13ac4c] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm'>
                1
              </div>
              <div className='flex-1 pt-1'>
                <p className='text-white font-semibold mb-1'>ブラウザメニューを開く</p>
                <p className='text-gray-400 text-sm'>
                  画面上部または下部のメニューアイコンをタップ
                </p>
              </div>
            </div>

            <div className='flex items-start gap-4'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#00a63e] to-[#13ac4c] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm'>
                2
              </div>
              <div className='flex-1 pt-1'>
                <p className='text-white font-semibold mb-1'>ホーム画面に追加</p>
                <p className='text-gray-400 text-sm'>「ホーム画面に追加」を選択</p>
              </div>
            </div>

            <div className='flex items-start gap-4'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#00a63e] to-[#13ac4c] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm'>
                3
              </div>
              <div className='flex-1 pt-1'>
                <p className='text-white font-semibold mb-1'>インストール完了</p>
                <p className='text-gray-400 text-sm'>アプリアイコンから起動してください</p>
              </div>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <button
          onClick={markInstalled}
          className='w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#00a63e] to-[#13ac4c] text-white font-bold shadow-lg shadow-green-900/30 hover:shadow-green-900/50 hover:scale-[1.02] transition-all duration-200 active:scale-95'
        >
          インストール済み — 開く
        </button>

        {/* 補足テキスト */}
        <p className='text-center text-gray-500 text-xs mt-4'>
          自動で戻らない場合は上のボタンを押してください
        </p>
      </div>
    </div>
  );
}
