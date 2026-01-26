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
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div>
          <h2 className="text-3xl font-bold text-center text-white">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            松本の"今"を切り取ろう
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white">
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-md disabled:opacity-50 font-semibold transition border border-green-500 shadow-lg shadow-green-600/30"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <div className="text-center text-sm">
            <Link href="/register" className="text-green-400 hover:text-green-300">
              アカウントを作成
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}