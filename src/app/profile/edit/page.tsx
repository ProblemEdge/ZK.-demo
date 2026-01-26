'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data);
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setAvatarPreview(data.avatarUrl || '');
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let avatarUrl = user?.avatarUrl;

      // 画像をアップロード
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadRes = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error);
        }

        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.avatarUrl;
      }

      // プロフィール更新
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          avatarUrl
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      alert('プロフィールを更新しました');
      router.push('/profile?updated=' + Date.now()); // クエリパラメータで再取得をトリガー

    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white font-medium"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-white">プロフィール編集</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700">
              {error}
            </div>
          )}

          {/* アバター画像 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <label className="block text-sm font-medium text-white mb-4">
              プロフィール画像
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border-2 border-gray-600">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-400">
                    {user.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 border border-gray-600 font-medium">
                画像を選択
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              最大5MB、JPG/PNG形式
            </p>
          </div>

          {/* 表示名 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <label className="block text-sm font-medium text-white mb-2">
              表示名
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-500"
              placeholder={user.username}
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">
              {displayName.length}/50文字
            </p>
          </div>

          {/* 自己紹介 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <label className="block text-sm font-medium text-white mb-2">
              自己紹介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-500"
              rows={4}
              placeholder="松本の魅力を伝えたい..."
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {bio.length}/200文字
            </p>
          </div>

          {/* ユーザー名（変更不可） */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <label className="block text-sm font-medium text-white mb-2">
              ユーザー名（変更不可）
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed border border-green-500 shadow-lg shadow-green-600/30"
          >
            {loading ? '更新中...' : '保存する'}
          </button>
        </form>
      </div>
    </div>
  );
}
