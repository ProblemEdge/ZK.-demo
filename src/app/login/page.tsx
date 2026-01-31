'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      alert('ログイン成功！');
      router.push('/');
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-0 min-h-svh h-svh w-full bg-gradient-to-b from-[#0b0c0f] to-[#0f0f0f] flex flex-col items-center justify-center overflow-hidden">
      {/* ロゴ */}
      <div className="mb-4 flex items-center justify-center z-10">
        <span className="text-white text-[64px] font-bold select-none">ZK.</span>
      </div>
      {/* パネル */}
      <div className="w-full max-w-[352px] h-auto bg-gradient-to-b from-[rgba(20,22,26,0.2)] to-[rgba(102,105,110,0.2)] border-2 border-[#0e4b7f] rounded-[24px] shadow-[0px_8px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center px-[21px] py-[25px] overflow-auto mx-auto">
        <div className="w-full flex flex-col items-center gap-[24px]">
          <div className="w-full flex flex-col items-center gap-[24px]">
            {/* タイトル */}
            <div className="w-[174px] flex flex-col items-center gap-[8px]">
              <p className="text-[32px] text-white font-bold text-center">ログイン</p>
              <p className="text-[16px] text-[#475467]">松本の”今”を切り取ろう</p>
            </div>
            {/* 入力フォーム */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[32px] items-start">
              <div className="w-full flex flex-col gap-[8px]">
                <div className="w-full flex flex-col gap-[4px] h-[58px] items-center justify-center">
                  <label className="text-[12px] text-white font-bold w-full">ユーザー名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#475467] h-[38px] rounded-[4px] w-full px-3 text-white outline-none"
                    required
                  />
                </div>
                <div className="w-full flex flex-col gap-[4px] h-[58px] items-center justify-center">
                  <label className="text-[12px] text-white font-bold w-full">パスワード</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#475467] h-[38px] rounded-[4px] w-full px-3 text-white outline-none"
                    required
                  />
                </div>
              </div>
              {/* エラー表示 */}
              {error && (
                <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700 w-full text-center">
                  {error}
                </div>
              )}
              {/* ログインボタン */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[38px] rounded-[4px] bg-gradient-to-b from-[#00a63e] to-[#13ac4c] text-white font-bold shadow-[0px_2px_4px_0px_rgba(32,192,67,0.25)] px-[118px] py-[9px] flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          </div>
          {/* 新規アカウント作成リンク */}
          <Link href="/register" className="text-[#00b54c] text-[12px] font-bold text-center w-full hover:underline mt-6 block">
            新規アカウントを作成
          </Link>
        </div>
      </div>
    </div>
  );
}