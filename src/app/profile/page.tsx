'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '../components/BottomNav';

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
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  tags: string;
  postedAt: string;
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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchUserData();
    fetchMyPosts();
  }, [searchParams]); // searchParamsが変わったら再取得

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store' // キャッシュを無効化
      });
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

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
      const res = await fetch('/api/auth/me', {
        cache: 'no-store'
      });
      
      if (!res.ok) return;
      
      const userData = await res.json();
      setFollowersLoading(true);
      
      const followersRes = await fetch(`/api/users/${userData.id}/following`, {
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
      const res = await fetch('/api/auth/me', {
        cache: 'no-store'
      });
      
      if (!res.ok) return;
      
      const userData = await res.json();
      setFollowingLoading(true);
      
      const followingRes = await fetch(`/api/users/${userData.id}/followers`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 shadow-md">
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

          {/* 統計 */}
          <div className="flex justify-around mt-6 pt-6 border-t border-gray-700">
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

        {/* 投稿一覧 */}
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
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
                >
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      📸
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                        {follower.isFollowing ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollowFromList(follower.id);
                            }}
                            className="px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-semibold hover:bg-red-600 transition border border-gray-600 hover:border-red-500"
                          >
                            フォロー中
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowFromList(follower.id);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold hover:bg-green-500 transition border border-green-500"
                          >
                            +
                          </button>
                        )}
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
                        {user.isFollowing ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollowFromList(user.id);
                            }}
                            className="px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-semibold hover:bg-red-600 transition border border-gray-600 hover:border-red-500"
                          >
                            フォロー中
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowFromList(user.id);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold hover:bg-green-500 transition border border-green-500"
                          >
                            +
                          </button>
                        )}
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