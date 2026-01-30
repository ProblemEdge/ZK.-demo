'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { useReward } from '../context/RewardContext';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  level: number;
  gems: number;
  experience: number;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  tags: string;
  postedAt: string;
  rejectedAt: string | null;
  isApproved: boolean;
  visibilityScope: 'PUBLIC' | 'FOLLOWERS';
  visibilityDurationMinutes: number | null;
  questId?: string | null;
  quest?: {
    id: string;
    title: string;
    description: string;
    date: string;
  } | null;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface FollowRequestItem {
  id: string;
  requester: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}

function ProfilePageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questExpanded, setQuestExpanded] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [followRequests, setFollowRequests] = useState<FollowRequestItem[]>([]);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showReward } = useReward();
  const { user: authUser, status, refresh } = useAuth();

  // 報酬をチェックする関数
  const checkRewards = async () => {
    try {
      const res = await fetch('/api/notifications/check-rewards');
      if (res.ok) {
        const data = await res.json();
        if (data.hasReward && data.reward) {
          showReward(data.reward);
        }
      }
    } catch (err) {
      console.error('Reward check error:', err);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      if (authUser) {
        setUser(authUser);
      }
      setLoading(false);
      fetchMyPosts();
      fetchQuests();
      fetchNotifications();
      fetchFollowRequests();
      checkRewards(); // 報酬チェックを追加

      if (searchParams?.get('updated')) {
        void refresh();
      }
    }
  }, [status, authUser, searchParams, refresh, router]); // searchParamsが変わったら再取得

  // ページが見えるようになったときにクエストを再フェッチ（投票完了時の更新を反映）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchQuests();
      }
    };

    // 初期状態でも見えていれば再フェッチ
    if (document.visibilityState === 'visible') {
      fetchQuests();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchMyPosts = async () => {
    try {
      const res = await fetch('/api/posts/my-posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchQuests = async () => {
    setQuestsLoading(true);
    try {
      const res = await fetch('/api/quests/today', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setQuests(data.quests || []);
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setQuestsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchFollowRequests = async () => {
    setFollowRequestsLoading(true);
    try {
      const res = await fetch('/api/follows/requests?type=incoming', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setFollowRequests(data);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setFollowRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requesterId: string) => {
    try {
      const res = await fetch('/api/follows/requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '承認に失敗しました');
        return;
      }

      fetchFollowRequests();
      fetchNotifications();
    } catch (error) {
      console.error('Approve request error:', error);
      alert('承認に失敗しました');
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    try {
      const res = await fetch('/api/follows/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '拒否に失敗しました');
        return;
      }

      fetchFollowRequests();
      fetchNotifications();
    } catch (error) {
      console.error('Reject request error:', error);
      alert('拒否に失敗しました');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        fetchNotifications();
      }
    } catch (error) {
      console.error('Mark notifications read error:', error);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error('Mark single notification read error:', error);
    }
  };

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const targetUserId = user?.id;
      if (!targetUserId) return;
      setFollowersLoading(true);
      
      const followersRes = await fetch(`/api/users/${targetUserId}/followers`, {
        cache: 'no-store'
      });

      if (followersRes.ok) {
        const data = await followersRes.json();
        setFollowers(data);
        setShowFollowersModal(true);
      }
    } catch (err) {
      console.error('Error fetching followers:', err);
      alert('フォロワー一覧の取得に失敗しました');
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      const targetUserId = user?.id;
      if (!targetUserId) return;
      setFollowingLoading(true);
      
      const followingRes = await fetch(`/api/users/${targetUserId}/following`, {
        cache: 'no-store'
      });

      if (followingRes.ok) {
        const data = await followingRes.json();
        setFollowing(data);
        setShowFollowingModal(true);
      }
    } catch (err) {
      console.error('Error fetching following:', err);
      alert('フォロー中のユーザー一覧の取得に失敗しました');
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleFollowFromList = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/follows/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      // リストを更新
      setFollowers(followers.map(f => f.id === targetUserId ? { ...f, isFollowing: true } : f));
      setFollowing(following.map(f => f.id === targetUserId ? { ...f, isFollowing: true } : f));
    } catch (err) {
      console.error('Follow error:', err);
      alert('フォローに失敗しました');
    }
  };

  const handleUnfollowFromList = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/follows/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      // リストを更新
      setFollowers(followers.map(f => f.id === targetUserId ? { ...f, isFollowing: false } : f));
      setFollowing(following.map(f => f.id === targetUserId ? { ...f, isFollowing: false } : f));
    } catch (err) {
      console.error('Unfollow error:', err);
      alert('フォロー解除に失敗しました');
    }
  };

  const handleRemoveFollower = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/follows/remove-follower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      // リストを更新
      setFollowers(followers.filter(f => f.id !== targetUserId));
    } catch (err) {
      console.error('Remove follower error:', err);
      alert('フォロワー削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingCount = followRequests.length;

  return (
    <div className="min-h-screen bg-gray-900 pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 shadow-md" style={{ marginTop: 'calc(-1 * var(--safe-area-top))', paddingTop: 'calc(1rem + var(--safe-area-top))', position: 'sticky', top: 'calc(-1 * var(--safe-area-top))', zIndex: 40 }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">プロフィール</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/profile/edit')}
              className="text-sm text-green-400 hover:text-green-300 font-medium"
            >
              編集
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* ユーザー情報 */}
        <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
          <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl overflow-hidden border-2 border-green-400">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {user.displayName || user.username}
          </h2>
          {user.displayName && (
            <p className="text-sm text-gray-400">@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-sm text-gray-300 mt-2">{user.bio}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
          </p>

          {/* レベル・ジェム情報 */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex gap-4 justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{user.level}</p>
              <p className="text-xs text-gray-400 mt-1">LV</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{user.gems}</p>
              <p className="text-xs text-gray-400 mt-1">ジェム</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{user.experience}</p>
              <p className="text-xs text-gray-400 mt-1">EXP</p>
            </div>
          </div>

          {/* 上がり残ら */}
          <div className="mt-4 bg-gray-700/50 rounded-full h-2 overflow-hidden border border-gray-600">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all"
              style={{ 
                width: `${user && user.experience ? Math.min((user.experience % 100) / 100 * 100, 100) : 0}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">
            {user && user.experience ? (user.experience % 100) : 0}/100 EXP
          </p>

          {/* 統計 */}
          <div className="flex justify-around mt-4 pt-4 border-t border-gray-700">
            <div>
              <p className="text-2xl font-bold text-white">{user.postCount}</p>
              <p className="text-xs text-gray-400">投稿</p>
            </div>
            <button
              onClick={fetchFollowers}
              className="hover:text-green-400 transition text-center"
            >
              <p className="text-2xl font-bold text-white">{user.followerCount}</p>
              <p className="text-xs text-gray-400">フォロワー</p>
            </button>
            <button
              onClick={fetchFollowing}
              className="hover:text-green-400 transition text-center"
            >
              <p className="text-2xl font-bold text-white">{user.followingCount}</p>
              <p className="text-xs text-gray-400">フォロー中</p>
            </button>
          </div>
        </div>

        {/* デイリークエスト */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <button
            onClick={() => setQuestExpanded(!questExpanded)}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">✨</span>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">
                  今日のクエスト
                </h3>
                <p className="text-sm text-purple-200">
                  デイリーチャレンジに挑戦しよう
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!questsLoading && (
                <span className="text-xs font-bold text-white">
                  {quests.filter(q => q.completed).length}/{quests.length}
                </span>
              )}
              <span className="text-2xl text-gray-400">
                {questExpanded ? '▼' : '▶'}
              </span>
            </div>
          </button>

          {questExpanded && (
            <div className="border-t border-gray-700">
              {/* 進捗バー */}
              <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-6">
                <div className="flex items-center justify-between text-sm text-purple-200 mb-2">
                  <span>進捗状況</span>
                  <span className="font-bold">
                    {quests.filter(q => q.completed).length} / {quests.length}
                  </span>
                </div>
                <div className="w-full bg-purple-950 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all duration-500"
                    style={{ 
                      width: `${quests.length > 0 ? (quests.filter(q => q.completed).length / quests.length) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* クエストリスト */}
              <div className="p-6 space-y-4 bg-gray-900">
                {questsLoading ? (
                  <p className="text-gray-400 text-center py-8">読み込み中...</p>
                ) : quests.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">クエストが見つかりません</p>
                ) : (
                  <>
                    {quests.map((quest, index) => (
                      <div
                        key={quest.id}
                        className={`p-5 rounded-xl border-2 transition-all ${
                          quest.completed
                            ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-600'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2 gap-2">
                              <span className="text-sm font-bold text-purple-400">
                                #{index + 1}
                              </span>
                              <h3 className="text-lg font-bold text-white">
                                {quest.title}
                              </h3>
                              {!quest.completed && quest.inProgress && (
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-yellow-600 text-white font-semibold border border-yellow-300 whitespace-nowrap">
                                  進行中
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {quest.description}
                            </p>
                            {quest.completed && quest.completedAt && (
                              <div className="mt-3 flex items-center text-green-400 text-sm">
                                <span className="mr-2">✓</span>
                                達成！{new Date(quest.completedAt).toLocaleTimeString('ja-JP', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {quest.completed ? (
                              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-2xl">
                                ✓
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-700 border-2 border-gray-600 rounded-full flex items-center justify-center text-gray-500">
                                <div className="w-6 h-6 border-2 border-gray-600 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 完了メッセージ */}
                    {quests.filter(q => q.completed).length === quests.length && quests.length > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600 rounded-xl text-center">
                        <div className="text-5xl mb-3">🎉</div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">
                          全クエスト達成！
                        </h3>
                        <p className="text-yellow-200 text-sm">
                          今日のデイリーチャレンジを全てクリアしました！
                        </p>
                      </div>
                    )}

                    {/* ヒント */}
                    <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        💡 ヒント: 投稿ページで「✨ クエスト投稿」を選択し、クエストを選んで投稿すると達成できます。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 通知センター */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <button
            onClick={() => setNotificationsExpanded(!notificationsExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">通知センター</h3>
                <p className="text-xs text-gray-400">
                  未読 {unreadCount}件 / リクエスト {pendingCount}件
                </p>
              </div>
            </div>
            <span className="text-gray-300 text-sm">
              {notificationsExpanded ? '▲' : '▼'}
            </span>
          </button>

          {notificationsExpanded && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">フォローリクエスト</p>
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-gray-300 hover:text-white"
                >
                  すべて既読にする
                </button>
              </div>

              {followRequestsLoading ? (
                <p className="text-xs text-gray-400">読み込み中...</p>
              ) : followRequests.length === 0 ? (
                <p className="text-xs text-gray-500">リクエストはありません</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {followRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {req.requester.avatarUrl ? (
                          <img src={req.requester.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                            {req.requester.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white font-semibold">
                            {req.requester.displayName || req.requester.username}
                          </p>
                          <p className="text-xs text-gray-400">@{req.requester.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(req.requester.id)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-500"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.requester.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded-full hover:bg-red-500"
                        >
                          拒否
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-300 mb-2">通知</p>
                {notificationsLoading ? (
                  <p className="text-xs text-gray-400">読み込み中...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-xs text-gray-500">通知はありません</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 ${n.isRead ? 'opacity-70' : ''} cursor-pointer`}
                        onClick={() => !n.isRead && markNotificationRead(n.id)}
                      >
                        {n.actor?.avatarUrl ? (
                          <img src={n.actor.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                            {n.actor?.username?.[0]?.toUpperCase() || '🔔'}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-white font-semibold">{n.title}</p>
                          {n.body && <p className="text-xs text-gray-400">{n.body}</p>}
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(n.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        {n.link && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.isRead) markNotificationRead(n.id);
                              router.push(n.link!);
                            }}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            開く
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-white mb-4">あなたの投稿</h3>
          
          {posts.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
              <p className="text-gray-300">まだ投稿がありません</p>
              <button
                onClick={() => router.push('/post')}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-semibold border border-green-500"
              >
                最初の一枚を投稿
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => {
                // 表示期間内かチェック
                const now = Date.now();
                const isWithinDuration = post.isApproved || (!post.rejectedAt && post.visibilityDurationMinutes !== null
                  ? new Date(post.postedAt).getTime() >= (now - (post.visibilityDurationMinutes || 1440) * 60 * 1000)
                  : !post.rejectedAt);

                return (
                  <div
                    key={post.id}
                    className={`aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700 relative group ${
                      post.rejectedAt ? 'opacity-50 bg-red-950/30' : ''
                    }`}
                  >
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                        onClick={() => setSelectedImage(post.imageUrl)}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📸
                      </div>
                    )}

                    {/* ホバー時に表示スコープ情報を表示 */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                      <div className="text-center">
                        {post.visibilityScope === 'PUBLIC' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-blue-400 text-xs">🌍 全世界に表示</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-green-400 text-xs">👥 フォロワーのみ</span>
                          </div>
                        )}
                        {post.visibilityDurationMinutes && (
                          <span className="text-gray-300 text-xs">
                            {post.visibilityDurationMinutes === 1440
                              ? '24時間表示'
                              : `${post.visibilityDurationMinutes}分表示`}
                          </span>
                        )}
                      </div>
                    </div>

                    {post.rejectedAt && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-600/40">
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">却下</span>
                      </div>
                    )}
                    {post.quest && (
                      <div className="absolute top-1 left-1 bg-purple-600/80 text-white text-xs px-2 py-1 rounded max-w-full truncate" title={post.quest.title}>
                        ✨ {post.quest.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* フルスクリーン画像モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="フルスクリーン表示"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition"
          >
            ✕
          </button>
        </div>
      )}
      {/* フォロワーモーダル */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-96 flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">フォロワー</h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {followersLoading ? (
                <div className="p-4 text-center text-gray-400">読み込み中...</div>
              ) : followers.length === 0 ? (
                <div className="p-4 text-center text-gray-400">フォロワーがいません</div>
              ) : (
                <div className="space-y-3 p-4">
                  {followers.map((follower) => (
                    <div
                      key={follower.id}
                      className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg transition cursor-pointer"
                      onClick={() => {
                        setShowFollowersModal(false);
                        router.push(`/user/${follower.id}`);
                      }}
                    >
                      <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600">
                        {follower.avatarUrl ? (
                          <img
                            src={follower.avatarUrl}
                            alt={follower.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">
                            {follower.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {follower.displayName || follower.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">@{follower.username}</p>
                      </div>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFollower(follower.id);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-500 transition border border-red-500"
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
      )}

      {/* フォロー中モーダル */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-96 flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">フォロー中</h3>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {followingLoading ? (
                <div className="p-4 text-center text-gray-400">読み込み中...</div>
              ) : following.length === 0 ? (
                <div className="p-4 text-center text-gray-400">フォロー中のユーザーがいません</div>
              ) : (
                <div className="space-y-3 p-4">
                  {following.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg transition cursor-pointer"
                      onClick={() => {
                        setShowFollowingModal(false);
                        router.push(`/user/${user.id}`);
                      }}
                    >
                      <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">
                            {user.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                      </div>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnfollowFromList(user.id);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-500 transition border border-red-500"
                        >
                          フォロー解除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">読み込み中...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}