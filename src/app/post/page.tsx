'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';

export default function PostPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();

  const tags = ['松本城', '美ヶ原', '縄手通り', '雪', '桜', '蔵', '湧水', '工芸', '城下町'];

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
          caption: caption.trim(),
          tags: selectedTags.join(',')
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
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 sticky top-0 shadow-md">
        <h1 className="text-2xl font-bold text-white">今日の一枚</h1>
        <p className="text-sm text-gray-300 mt-1">松本の"今"を切り取ろう</p>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/80 text-red-200 p-3 rounded-lg border border-red-700">
              {error}
            </div>
          )}

          {/* 画像プレビュー */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              写真を選択
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
                  変更
                </button>
              </div>
            ) : (
              <label className="block w-full bg-gray-800 hover:bg-gray-700 h-64 rounded-lg flex items-center justify-center cursor-pointer border border-gray-700">
                <span className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <div>写真を選択</div>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
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
              タグを選択（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedTags.includes(tag)
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/50 border border-green-500'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 投稿ボタン */}
          <button
            type="submit"
            disabled={loading || !imageFile || !caption.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed border border-green-500 shadow-lg shadow-green-600/30"
          >
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}