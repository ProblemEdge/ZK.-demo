'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAdmin } from '@/actions/badge';
import { 
  useBadges, 
  createBadge, 
  awardBadge, 
  revokeBadge, 
  deleteBadge,
  type Badge,
} from '@/domains/badges/hooks';
import { useUserSearch } from '@/domains/user/hooks';

export default function BadgeAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  
  // バッジ作成フォーム
  const [newBadge, setNewBadge] = useState({
    name: '',
    displayName: '',
    description: '',
    imageUrl: ''
  });
  
  // バッジ付与フォーム
  const [awardForm, setAwardForm] = useState({
    userId: '',
    badgeName: ''
  });

  // ユーザー検索
  const [searchQuery, setSearchQuery] = useState('');

  // バッジはく奪フォーム
  const [revokeForm, setRevokeForm] = useState({
    userId: '',
    badgeName: ''
  });

  const router = useRouter();

  // ドメイン層のフックを使用
  const { badges, mutate: mutateBadges, isLoading: loading } = useBadges();
  const { users: searchResults } = useUserSearch(searchQuery);

  const handleLogin = async () => {
    try {
      await verifyAdmin(accessKey);
      setAuthenticated(true);
      localStorage.setItem('admin-key', accessKey);
      mutateBadges();
    } catch (error) {
      console.error('認証エラー:', error);
      alert('アクセスキーが正しくありません');
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBadge(newBadge);
      alert('バッジを作成しました');
      setNewBadge({ name: '', displayName: '', description: '', imageUrl: '' });
      mutateBadges();
    } catch (error) {
      console.error('バッジ作成エラー:', error);
      alert('バッジの作成に失敗しました');
    }
  };

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await awardBadge(awardForm);
      alert('バッジを付与しました');
      setAwardForm({ userId: '', badgeName: '' });
      mutateBadges();
    } catch (error) {
      console.error('バッジ付与エラー:', error);
      alert('バッジの付与に失敗しました');
    }
  };

  const handleRevokeBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('本当にバッジをはく奪しますか？')) return;
    
    try {
      await revokeBadge(revokeForm);
      alert('バッジをはく奪しました');
      setRevokeForm({ userId: '', badgeName: '' });
      mutateBadges();
    } catch (error) {
      console.error('バッジはく奪エラー:', error);
      alert('バッジのはく奪に失敗しました');
    }
  };

  const handleDeleteBadge = async (badgeId: string, badgeName: string) => {
    if (!confirm(`「${badgeName}」を削除しますか？このバッジを持つすべてのユーザーから削除されます。`)) return;
    
    try {
      await deleteBadge(badgeId);
      alert('バッジを削除しました');
      mutateBadges();
    } catch (error) {
      console.error('バッジ削除エラー:', error);
      alert('バッジの削除に失敗しました');
    }
  };

  const selectUser = (userId: string, username: string, forRevoke = false) => {
    if (forRevoke) {
      setRevokeForm({ ...revokeForm, userId });
    } else {
      setAwardForm({ ...awardForm, userId });
    }
    setSearchQuery('');
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('admin-key');
    if (savedKey) {
      setAccessKey(savedKey);
      verifyAdmin(savedKey)
        .then(() => {
          setAuthenticated(true);
          mutateBadges();
        })
        .catch(() => {
          localStorage.removeItem('admin-key');
        });
    }
  }, [mutateBadges]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
        <div className="bg-[#14161a] border border-white rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">バッジ管理</h1>
          <div className="space-y-4">
            <input
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="アクセスキーを入力"
              className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 bg-[#00e676] text-white font-bold rounded-lg hover:bg-[#00d664] transition"
            >
              ログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c0f] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">バッジ管理</h1>
          <button
            onClick={() => {
              setAuthenticated(false);
              localStorage.removeItem('admin-key');
              router.push('/');
            }}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition"
          >
            ログアウト
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ユーザー検索 */}
          <div className="bg-[#14161a] border border-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">ユーザー検索</h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ユーザー名で検索..."
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="bg-[#0b0c0f] border border-white rounded-lg p-3 cursor-pointer hover:bg-[#1a1c20] transition"
                      onClick={() => selectUser(user.id, user.username)}
                    >
                      <p className="font-bold text-white">{user.displayName || user.username}</p>
                      <p className="text-xs text-[#bfbdbd]">@{user.username}</p>
                      <p className="text-xs text-[#475467] mt-1 font-mono">{user.id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* バッジ作成フォーム */}
          <div className="bg-[#14161a] border border-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">バッジを作成</h2>
            <form onSubmit={handleCreateBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">内部名（ユニーク）</label>
                <input
                  type="text"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  placeholder="developer-badge"
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">表示名</label>
                <input
                  type="text"
                  value={newBadge.displayName}
                  onChange={(e) => setNewBadge({ ...newBadge, displayName: e.target.value })}
                  placeholder="デベロッパー"
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">説明（任意）</label>
                <input
                  type="text"
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  placeholder="開発者専用バッジ"
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">画像URL</label>
                <input
                  type="text"
                  value={newBadge.imageUrl}
                  onChange={(e) => setNewBadge({ ...newBadge, imageUrl: e.target.value })}
                  placeholder="/icon/badge.png"
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#00e676] text-white font-bold rounded-lg hover:bg-[#00d664] transition"
              >
                バッジを作成
              </button>
            </form>
          </div>

          {/* バッジ付与フォーム */}
          <div className="bg-[#14161a] border border-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">バッジを付与</h2>
            <form onSubmit={handleAwardBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">ユーザーID（UUID）</label>
                <input
                  type="text"
                  value={awardForm.userId}
                  onChange={(e) => setAwardForm({ ...awardForm, userId: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">バッジ名</label>
                <select
                  value={awardForm.badgeName}
                  onChange={(e) => setAwardForm({ ...awardForm, badgeName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                >
                  <option value="">選択してください</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.name}>
                      {badge.displayName} ({badge.name})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#00e676] text-white font-bold rounded-lg hover:bg-[#00d664] transition"
              >
                バッジを付与
              </button>
            </form>
          </div>

          {/* バッジはく奪フォーム */}
          <div className="bg-[#14161a] border border-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">バッジをはく奪</h2>
            <form onSubmit={handleRevokeBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">ユーザーID（UUID）</label>
                <input
                  type="text"
                  value={revokeForm.userId}
                  onChange={(e) => setRevokeForm({ ...revokeForm, userId: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">バッジ名</label>
                <select
                  value={revokeForm.badgeName}
                  onChange={(e) => setRevokeForm({ ...revokeForm, badgeName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0b0c0f] text-white border border-white rounded-lg focus:outline-none focus:border-[#00e676]"
                  required
                >
                  <option value="">選択してください</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.name}>
                      {badge.displayName} ({badge.name})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition"
              >
                バッジをはく奪
              </button>
            </form>
          </div>
        </div>

        {/* バッジ一覧 */}
        <div className="mt-6 bg-[#14161a] border border-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">登録済みバッジ</h2>
          {loading ? (
            <p className="text-white">読み込み中...</p>
          ) : badges.length === 0 ? (
            <p className="text-[#bfbdbd]">バッジがありません</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="bg-[#0b0c0f] border border-white rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={badge.imageUrl} alt={badge.displayName} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{badge.displayName}</p>
                      <p className="text-xs text-[#bfbdbd] truncate">{badge.name}</p>
                    </div>
                  </div>
                  {badge.description && (
                    <p className="text-sm text-[#bfbdbd] mb-2">{badge.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#00e676]">{badge._count.users}人が所持</p>
                    <button
                      onClick={() => handleDeleteBadge(badge.id, badge.displayName)}
                      className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded border border-red-600/50 transition"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
