'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

type AvatarEditorHandle = {
  getCroppedBlob: () => Promise<Blob | null>;
  reset: () => void;
};

const AvatarEditor = forwardRef<AvatarEditorHandle, { preview: string; fallbackInitial: string }>(
  ({ preview, fallbackInitial }, ref) => {
    const containerSize = 200; // px for editor viewport
    const imgRef = useRef<HTMLImageElement | null>(null);
    const naturalRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
    const baseZoomRef = useRef<number>(1);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const draggingRef = useRef(false);
    const lastRef = useRef<{ x: number; y: number } | null>(null);
    const touchState = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      async getCroppedBlob() {
        const img = imgRef.current;
        if (!img || !naturalRef.current.w) return null;

        const outputSize = 512;
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const nw = naturalRef.current.w;
        const nh = naturalRef.current.h;
        const displayScale = baseZoomRef.current * scale;
        const displayW = nw * displayScale;
        const displayH = nh * displayScale;

        const imageDisplayLeft = (containerSize - displayW) / 2 + offset.x;
        const imageDisplayTop = (containerSize - displayH) / 2 + offset.y;

        // source rect in image pixels corresponding to viewport
        const srcX = Math.max(0, (-imageDisplayLeft) / displayW * nw);
        const srcY = Math.max(0, (-imageDisplayTop) / displayH * nh);
        const srcSize = Math.min(nw, nh, (containerSize / displayW) * nw, (containerSize / displayH) * nh);

        // clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize);
        ctx.restore();

        return await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => {
            resolve(b);
          }, 'image/png');
        });
      },
      reset() {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    }));

    const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      // base zoom so the image covers the viewport
      baseZoomRef.current = Math.max(containerSize / img.naturalWidth, containerSize / img.naturalHeight);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };

    // Pointer drag handlers
    const onPointerDown = (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: React.PointerEvent) => {
      if (!draggingRef.current || !lastRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setOffset((s) => ({ x: s.x + dx, y: s.y + dy }));
    };
    const onPointerUp = (e: React.PointerEvent) => {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      draggingRef.current = false;
      lastRef.current = null;
    };

    // Touch pinch handlers
    const onTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dx = b.clientX - a.clientX;
        const dy = b.clientY - a.clientY;
        touchState.current = { dist: Math.hypot(dx, dy), scale0: scale, center: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 } };
      }
    };
    const onTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchState.current) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dx = b.clientX - a.clientX;
        const dy = b.clientY - a.clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / touchState.current.dist;
        const newScale = Math.max(0.5, Math.min(4, touchState.current.scale0 * ratio));
        setScale(newScale);
      }
    };

    return (
      <div>
        <div
          style={{ width: containerSize, height: containerSize }}
          className="relative rounded-full overflow-hidden bg-gray-800 mx-auto"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          {preview ? (
            <img
              ref={imgRef}
              src={preview}
              alt="avatar-edit"
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${baseZoomRef.current * scale})`,
                transformOrigin: 'center center',
                userSelect: 'none',
                touchAction: 'none',
                willChange: 'transform'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">{fallbackInitial}</div>
          )}
        </div>

        <div className="mt-2 flex items-center space-x-2">
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="px-3 py-1 bg-gray-700 text-white rounded"
          >
            リセット
          </button>
        </div>
      </div>
    );
  }
);

AvatarEditor.displayName = 'AvatarEditor';

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarEditorRef = useRef<any>(null);
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
        let blob: Blob | null = null;
        try {
          blob = await avatarEditorRef.current?.getCroppedBlob();
        } catch (err) {
          blob = null;
        }

        const formData = new FormData();
        if (blob) formData.append('avatar', blob, 'avatar.png');
        else formData.append('avatar', avatarFile);

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
      await refresh();
      try {
        // 自分のアバター更新を反映するためのキャッシュバスターを保存
        if (user?.id) {
          localStorage.setItem(`avatar_v_${user.id}`, String(Date.now()));
          try {
            // notify other components in same tab
            window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { userId: user.id } }));
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c0f]">
      <header className="bg-[#0b0c0f] border-b-4 border-white p-4 shadow-md">
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
          <div className="bg-[#0b0c0f] rounded-lg p-6 border border-gray-700">
            <label className="block text-sm font-medium text-white mb-4">
              プロフィール画像
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border-2 border-gray-600">
                <div className="w-full h-full">
                  <AvatarEditor
                    ref={avatarEditorRef}
                    preview={avatarPreview}
                    fallbackInitial={user.username[0].toUpperCase()}
                  />
                </div>
              </div>
              <label className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 border border-gray-600 font-medium">
                画像を選択
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleAvatarChange(e);
                    setTimeout(() => {
                      try {
                        avatarEditorRef.current?.reset();
                      } catch {}
                    }, 50);
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              最大5MB、JPG/PNG形式
            </p>
          </div>

          {/* 表示名 */}
          <div className="bg-[#0b0c0f] rounded-lg p-6 border border-gray-700">
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
          <div className="bg-[#0b0c0f] rounded-lg p-6 border border-gray-700">
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
          <div className="bg-[#0b0c0f] rounded-lg p-6 border border-gray-700">
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

          {/* 通知設定 */}
          <div className="bg-[#0b0c0f] rounded-lg p-6 border border-gray-700">
            <label className="block text-sm font-medium text-white mb-2">
              通知設定
            </label>
            <p className="text-xs text-gray-400 mb-3">
              投稿の承認やいいねなどの通知を受け取れます
              {!isSupported && ' (※このブラウザでは未対応)'}
            </p>
            {isSupported ? (
              <button
                type="button"
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
              <div className="text-sm text-gray-400 p-3 bg-gray-700 rounded-lg border border-gray-600">
                このブラウザは通知機能に対応していません。PWAとしてホーム画面に追加してください。
              </div>
            )}
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
