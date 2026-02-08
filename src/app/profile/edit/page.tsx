'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import AvatarEditor from '../../components/AvatarEditor';

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
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const avatarEditorRef = useRef<any>(null);
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { permission, isSupported, requestPermission } = useNotifications();
  const { user: authUser, status, refresh } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && authUser) {
      setUser(authUser);
      setDisplayName(authUser.displayName || '');
      setBio(authUser.bio || '');
      setAvatarPreview(authUser.avatarUrl || '');
    }
  }, [status, authUser, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setCroppedBlob(null);
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

      // 画像をアップロード（切り抜き済みを送る）
      if (avatarFile) {
        // prefer an already-captured cropped blob (from 完了), otherwise try getting from editor
        let blob: Blob | null = croppedBlob ?? null;
        if (!blob) {
          try {
            blob = await avatarEditorRef.current?.getCroppedBlob();
          } catch (err) {
            console.error('getCroppedBlob threw', err);
            blob = null;
          }
        }
        console.debug('Avatar upload: haveBlob=', !!blob, 'avatarFile=', avatarFile);

        const formData = new FormData();
        if (blob) formData.append('avatar', blob, 'avatar.png');
        else formData.append('avatar', avatarFile);

        const uploadRes = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
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
          avatarUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      alert('プロフィールを更新しました');
      await refresh();
      try {
        // 自分のアバター更新を反映するためのキャッシュバスターを保存
        if (user?.id) {
          localStorage.setItem(`avatar_v_${user.id}`, String(Date.now()));
          try {
            // notify other components in same tab
            window.dispatchEvent(
              new CustomEvent('avatar-updated', { detail: { userId: user.id } }),
            );
          } catch {}
        }
      } catch {
        // noop
      }
      router.push('/profile?updated=' + Date.now()); // クエリパラメータで再取得をトリガー
    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <p className='text-gray-500'>読み込み中...</p>
      </div>
    );
  }

  return (
    <div
      className='min-h-screen bg-[#0b0c0f]'
      style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 12rem)' }}
    >
      <header className='bg-[#0b0c0f] border-b-4 border-white p-4 shadow-md'>
        <div className='flex items-center justify-between'>
          <button
            onClick={() => router.back()}
            className='text-gray-400 hover:text-white font-medium'
          >
            ← 戻る
          </button>
          <h1 className='text-2xl font-bold text-white'>プロフィール編集</h1>
          <div className='w-12'></div>
        </div>
      </header>

      <div className='p-4 max-w-2xl mx-auto'>
        {showFullEditor && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70'>
            <div className='bg-[#0b0c0f] p-6 rounded-lg max-w-[90vw] max-h-[90vh] overflow-auto'>
              <div className='flex justify-end mb-3'>
                <button
                  className='px-3 py-1 bg-gray-700 text-white rounded mr-2'
                  onClick={() => setShowFullEditor(false)}
                >
                  閉じる
                </button>
                <button
                  className='px-3 py-1 bg-green-600 text-white rounded'
                  onClick={async () => {
                    try {
                      const blob = await avatarEditorRef.current?.getCroppedBlob();
                      if (blob) {
                        setCroppedBlob(blob);
                        // show cropped preview in the small preview
                        try {
                          const url = URL.createObjectURL(blob);
                          setAvatarPreview(url);
                        } catch {}
                      }
                    } catch (err) {
                      console.error('完了ボタン: getCroppedBlob failed', err);
                    } finally {
                      setShowFullEditor(false);
                    }
                  }}
                >
                  完了
                </button>
              </div>
              <div className='flex justify-center'>
                <AvatarEditor
                  ref={avatarEditorRef}
                  preview={avatarPreview}
                  fallbackInitial={user?.username[0].toUpperCase() || ''}
                  containerSize={
                    typeof window !== 'undefined'
                      ? Math.min(
                          600,
                          Math.max(300, Math.min(window.innerWidth - 80, window.innerHeight - 160)),
                        )
                      : 360
                  }
                />
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className='space-y-6'>
          {error && (
            <div className='bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700'>
              {error}
            </div>
          )}

          {/* アバター画像 */}
          <div className='bg-[#0b0c0f] rounded-lg p-6 border border-gray-700'>
            <label className='block text-sm font-medium text-white mb-4'>プロフィール画像</label>
            <div className='flex items-center space-x-4'>
              <div className='w-24 h-24 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border-2 border-gray-600'>
                {avatarPreview || user.avatarUrl ? (
                  <img
                    src={avatarPreview || user.avatarUrl || ''}
                    alt={user.username}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-white text-2xl font-bold'>
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <label className='cursor-pointer px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 border border-gray-600 font-medium'>
                画像を選択
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => {
                    handleAvatarChange(e);
                    setTimeout(() => {
                      try {
                        avatarEditorRef.current?.reset();
                      } catch {}
                    }, 50);
                    setShowFullEditor(true);
                  }}
                  className='hidden'
                />
              </label>
            </div>
            <p className='text-xs text-gray-400 mt-2'>最大5MB、JPG/PNG形式</p>
          </div>

          {/* 表示名 */}
          <div className='bg-[#0b0c0f] rounded-lg p-6 border border-gray-700'>
            <label className='block text-sm font-medium text-white mb-2'>表示名</label>
            <input
              type='text'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-500'
              placeholder={user.username}
              maxLength={50}
            />
            <p className='text-xs text-gray-400 mt-1'>{displayName.length}/50文字</p>
          </div>

          {/* 自己紹介 */}
          <div className='bg-[#0b0c0f] rounded-lg p-6 border border-gray-700'>
            <label className='block text-sm font-medium text-white mb-2'>自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className='w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-500'
              rows={4}
              placeholder='松本の魅力を伝えたい...'
              maxLength={200}
            />
            <p className='text-xs text-gray-400 mt-1'>{bio.length}/200文字</p>
          </div>

          {/* ユーザー名（変更不可） */}
          <div className='bg-[#0b0c0f] rounded-lg p-6 border border-gray-700'>
            <label className='block text-sm font-medium text-white mb-2'>
              ユーザー名（変更不可）
            </label>
            <input
              type='text'
              value={user.username}
              disabled
              className='w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-gray-400'
            />
          </div>

          {/* 通知設定 */}
          <div className='bg-[#0b0c0f] rounded-lg p-6 border border-gray-700'>
            <label className='block text-sm font-medium text-white mb-2'>通知設定</label>
            <p className='text-xs text-gray-400 mb-3'>
              投稿の承認やいいねなどの通知を受け取れます
              {!isSupported && ' (※このブラウザでは未対応)'}
            </p>
            {isSupported ? (
              <button
                type='button'
                onClick={async () => {
                  const granted = await requestPermission();
                  if (granted) {
                    alert('通知が有効になりました！');
                  } else {
                    alert('通知が許可されませんでした');
                  }
                }}
                className={`w-full py-3 rounded-lg font-semibold transition border ${
                  permission === 'granted'
                    ? 'bg-green-600/20 text-green-300 border-green-600/50 cursor-default'
                    : 'bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-lg shadow-green-600/30'
                }`}
                disabled={permission === 'granted'}
              >
                {permission === 'granted' ? '✅ 通知オン' : '🔔 通知を有効化'}
              </button>
            ) : (
              <div className='text-sm text-gray-400 p-3 bg-gray-700 rounded-lg border border-gray-600'>
                このブラウザは通知機能に対応していません。PWAとしてホーム画面に追加してください。
              </div>
            )}
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed border border-green-500 shadow-lg shadow-green-600/30'
          >
            {loading ? '更新中...' : '保存する'}
          </button>
        </form>
      </div>
    </div>
  );
}
