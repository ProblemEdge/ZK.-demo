'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '../../components/BottomNav';

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
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

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserPosts();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('ユーザーが見つかりません');
      }

      const data = await res.json();
      setUser(data.user);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error('Error fetching user:', err);
      router.push('/discover');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/posts`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await fetch('/api/follows/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      setIsFollowing(true);
    } catch (err) {
      console.error('Follow error:', err);
      alert('フォローに失敗しました');
    }
  };

  const handleUnfollow = async () => {
    try {
      const res = await fetch('/api/follows/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      setIsFollowing(false);
    } catch (err) {
      console.error('Unfollow error:', err);
      alert('フォロー解除に失敗しました');
    }
  };

  const fetchFollowers = async () => {
    try {
      setFollowersLoading(true);
      const res = await fetch(`/api/users/${userId}/following`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
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
      setFollowingLoading(true);
      const res = await fetch(`/api/users/${userId}/followers`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pb-20">
        <p className="text-gray-300">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pb-20">
        <p className="text-gray-300">ユーザーが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 sticky top-0 z-40 shadow-md">
        <button
          onClick={() => router.back()}
          className="text-green-400 hover:text-green-300 text-lg font-bold mb-4"
        >
          ← 戻る
        </button>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* プロフィールセクション */}
        <div className="bg-gray-800 border-b border-gray-700 p-6">
          <div className="flex items-start gap-4 mb-4">
            {/* アバター */}
            <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border-2 border-green-500 flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {user.username[0].toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {user.displayName || user.username}
                </h1>
              </div>
              <p className="text-gray-400 mb-2">@{user.username}</p>
              
              {user.bio && (
                <p className="text-gray-300 mb-4">{user.bio}</p>
              )}

              {/* フォローボタン */}
              {isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  className="px-6 py-2 bg-gray-700 text-white rounded-full font-semibold hover:bg-red-600 transition border border-gray-600 hover:border-red-500"
                >
                  フォロー中
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-500 transition border border-green-500"
                >
                  フォロー
                </button>
              )}
            </div>
          </div>

          {/* 統計 */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold text-white">{user._count.posts}</span>
              <span className="text-gray-400"> 投稿</span>
            </div>
            <button
              onClick={fetchFollowers}
              className="hover:text-green-400 transition"
            >
              <span className="font-bold text-white">{user._count.followers}</span>
              <span className="text-gray-400"> フォロワー</span>
            </button>
            <button
              onClick={fetchFollowing}
              className="hover:text-green-400 transition"
            >
              <span className="font-bold text-white">{user._count.following}</span>
              <span className="text-gray-400"> フォロー中</span>
            </button>
          </div>
        </div>

        {/* 投稿セクション */}
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-4">承認された投稿</h2>
          
          {posts.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
              <p className="text-gray-400">投稿がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-500 transition cursor-pointer aspect-square"
                  onClick={() => router.push(`/feed?postId=${post.id}`)}
                >
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
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
