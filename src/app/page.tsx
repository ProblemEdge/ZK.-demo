'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        // ログイン済み → /feed にリダイレクト
        router.push('/feed');
      } else {
        // 未ログイン → /login にリダイレクト
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );
}
