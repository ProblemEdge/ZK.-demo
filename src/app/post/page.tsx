'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import QuestOverlay from '../components/QuestOverlay';
export default function PostPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [tokens, setTokens] = useState<{ limit: number; used: number; remaining: number; resetAt: string } | null>(null);
  const [visibilityScope, setVisibilityScope] = useState<'PUBLIC' | 'FOLLOWERS'>('FOLLOWERS');
  const [visibilityDuration, setVisibilityDuration] = useState<number | 'unlimited'>(1440); // デフォルト24h
  const [customTagInput, setCustomTagInput] = useState('');
  const [isQuestMode, setIsQuestMode] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const suggestedTags = ['松本城', '美ヶ原', '縄手通り', '雪', '桜', '蔵', '湧水', '工芸', '城下町'];

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch('/api/posts/shot-tokens', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTokens(data);
        }
      } catch (e) {}
    };

    const fetchQuests = async () => {
      try {
        const res = await fetch('/api/quests/today', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setQuests(data.quests || []);
        }
      } catch (e) {}
    };

    fetchTokens();
    fetchQuests();

    // 1分ごとに残り時間更新（0時まで）
    const interval = setInterval(() => {
      if (tokens?.resetAt) {
        const reset = new Date(tokens.resetAt).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((reset - now) / 1000))); // 秒
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [router, tokens?.resetAt]);

  // ネイティブカメラピッカーを開く
  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('ブラウザが位置情報に対応していません');
      return;
    }

    setError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('位置情報の取得に失敗しました');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. 画像をアップロード
      if (!imageFile) {
        throw new Error('画像を選択してください');
      }

      const formData = new FormData();
      formData.append('image', imageFile);

      const uploadRes = await fetch('/api/upload/post', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error);
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.imageUrl;

      // 2. 投稿を作成
      const createRes = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          caption: caption.trim() || '',
          tags: selectedTags.join(','),
          visibilityScope,
          visibilityDuration,
          questId: isQuestMode ? selectedQuestId : null,
          latitude: latitude,
          longitude: longitude,
          locationName: locationName.trim() || null
        })
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error);
      }

      alert('投稿しました！');
      router.push('/profile');

    } catch (err: any) {
      setError(err.message || '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 sticky shadow-md z-40" style={{ top: '0' }}>
        <div style={{ paddingTop: 'var(--safe-area-top)', padding: '1rem' }}>
          <h1 className="text-2xl font-bold text-white">今日の一枚</h1>
          <p className="text-sm text-gray-300 mt-1">松本の"今"を切り取ろう</p>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {/* デバッグボタン */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/posts/shot-tokens/reset', { method: 'POST' });
                if (res.ok) {
                  alert('投稿上限をリセットしました');
                  const tokenRes = await fetch('/api/posts/shot-tokens', { cache: 'no-store' });
                  if (tokenRes.ok) {
                    const data = await tokenRes.json();
                    setTokens(data);
                  }
                }
              } catch (e) {
                alert('リセットに失敗しました');
              }
            }}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition"
          >
            [DEBUG] 投稿上限回復
          </button>
        </div>

        {/* ショットトークン表示 */}
        {tokens && (
          <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              今日の投稿可能回数: <span className="font-bold text-white">{tokens.remaining}</span>/<span>{tokens.limit}</span>
            </div>
            <div className="text-xs text-gray-400">
              リセット: {new Date(tokens.resetAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* クエストモード切替 */}
        <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setIsQuestMode(false);
                setSelectedQuestId(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
                !isQuestMode
                  ? 'bg-green-600 text-white border border-green-500'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              📸 通常
            </button>
            <button
              type="button"
              onClick={() => setIsQuestMode(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
                isQuestMode
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              ✨ クエスト
            </button>
          </div>

          {/* クエスト選択 */}
          {isQuestMode && (
            <div className="space-y-2">
              <p className="text-sm text-gray-300 font-medium">今日のデイリークエスト:</p>
              {quests.length === 0 ? (
                <p className="text-xs text-gray-400">クエストを読み込み中...</p>
              ) : (
                quests.map((quest) => (
                  <button
                    key={quest.id}
                    type="button"
                    onClick={() => setSelectedQuestId(quest.id)}
                    disabled={quest.completed || quest.inProgress || quest.locked}
                    className={`w-full p-3 rounded-lg text-left transition ${
                      selectedQuestId === quest.id
                        ? 'bg-blue-600 text-white border border-blue-400'
                        : quest.completed
                        ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                        : quest.inProgress
                        ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-600 cursor-not-allowed'
                        : quest.locked
                        ? 'bg-gray-800/50 text-gray-500 border border-gray-700 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{quest.title}</p>
                        <p className="text-xs opacity-80 mt-1">{quest.description}</p>
                        {quest.inProgress && (
                          <p className="text-xs text-yellow-400 mt-1">⏳ 投票中...</p>
                        )}
                        {quest.locked && (
                          <p className="text-xs text-gray-400 mt-1">🔒 次の時間帯に開放</p>
                        )}
                      </div>
                      {quest.completed && (
                        <span className="text-green-400 text-xl ml-2">✓</span>
                      )}
                      {quest.inProgress && (
                        <span className="text-yellow-400 text-xl ml-2">⏳</span>
                      )}
                      {quest.locked && (
                        <span className="text-gray-500 text-xl ml-2">🔒</span>
                      )}
                    </div>
                  </button>
                ))
              )}
              {isQuestMode && !selectedQuestId && quests.some(q => !q.completed) && (
                <p className="text-xs text-yellow-400 mt-2">⚠️ クエストを選択してください</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700">
              {error}
            </div>
          )}

          {/* 画像入力 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              写真を撮影
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg object-cover max-h-96"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold"
                >
                  撮り直す
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={openCamera}
                  className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 h-64 rounded-lg flex items-center justify-center cursor-pointer border-2 border-blue-500 transition shadow-lg"
                >
                  <span className="text-white text-center">
                    <div className="text-5xl mb-3">📷</div>
                    <div className="font-semibold text-lg">カメラで撮影</div>
                    <div className="text-sm mt-2 opacity-90">タップして撮影開始</div>
                  </span>
                </button>
              </>
            )}
          </div>

          {/* キャプション */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              キャプション
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-500"
              rows={3}
              placeholder="今この瞬間の松本を説明してください..."
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">
              {caption.length}/300文字
            </p>
          </div>

          {/* タグ選択 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              タグ（複数選択可・自由入力可）
            </label>
            
            {/* 選択済みタグ */}
            {selectedTags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium border border-green-500 flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-300 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 推奨タグ */}
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-2">推奨タグ:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      selectedTags.includes(tag)
                        ? 'bg-green-600/50 text-white border border-green-500'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* カスタムタグ入力 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="カスタムタグを入力..."
                className="flex-1 px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-semibold transition border border-blue-500"
              >
                追加
              </button>
            </div>
          </div>

          {/* 位置情報（任意） */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">位置情報（任意）</p>
                <p className="text-xs text-gray-400">マップタブでピン表示されます</p>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className={`px-3 py-1 rounded-md text-xs font-semibold border ${
                  locating
                    ? 'bg-gray-700 text-gray-400 border-gray-600'
                    : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                }`}
              >
                {locating ? '取得中…' : '現在地を取得'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.000001"
                placeholder="緯度 (例: 35.68)"
                value={latitude ?? ''}
                onChange={(e) => setLatitude(e.target.value === '' ? null : parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white placeholder-gray-500 text-sm"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.000001"
                placeholder="経度 (例: 139.76)"
                value={longitude ?? ''}
                onChange={(e) => setLongitude(e.target.value === '' ? null : parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white placeholder-gray-500 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="場所の名前 (任意)"
              value={locationName}
              maxLength={100}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white placeholder-gray-500 text-sm"
            />

            <p className="text-[11px] text-gray-500">緯度と経度を両方入力した場合のみ保存されます</p>
          </div>

          {/* 公開範囲 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">公開範囲</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="radio"
                  name="scope"
                  checked={visibilityScope === 'FOLLOWERS'}
                  onChange={() => setVisibilityScope('FOLLOWERS')}
                />
                フォロワーのみ
              </label>
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="radio"
                  name="scope"
                  checked={visibilityScope === 'PUBLIC'}
                  onChange={() => setVisibilityScope('PUBLIC')}
                />
                世界（全体公開）
              </label>
            </div>
          </div>

          {/* 公開期間 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">公開期間（投票表示時間）</label>
            <select
              value={visibilityDuration === 'unlimited' ? 'unlimited' : visibilityDuration}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'unlimited') setVisibilityDuration('unlimited');
                else setVisibilityDuration(Number(val));
              }}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white"
            >
              <option value={5}>5分</option>
              <option value={10}>10分</option>
              <option value={30}>30分</option>
              <option value={60}>1時間</option>
              <option value={120}>2時間</option>
              <option value={180}>3時間</option>
              <option value={360}>6時間</option>
              <option value={720}>12時間</option>
              <option value={1440}>24時間 (デフォルト)</option>
              <option value={2880}>48時間</option>
              <option value={10080}>7日間</option>
              <option value="unlimited">無制限</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">承認されるまで投稿者は匿名で表示されます（デフォルト24時間）</p>
          </div>

          {/* 投稿ボタン */}
          <button
            type="submit"
            disabled={loading || !imageFile || (!!tokens && tokens.remaining <= 0) || (isQuestMode && !selectedQuestId)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed border border-green-500 shadow-lg shadow-green-600/30"
          >
            {loading ? '投稿中...' : ((!!tokens && tokens.remaining <= 0) ? '本日の上限に達しました' : '投稿する')}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}