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
  level: number;
  gems: number;
  experience: number;
  _count: {
    posts: number;
    friends: number;
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
    friends: number;
  };
  isFriend: boolean;
}

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isRequestedByMe, setIsRequestedByMe] = useState(false);
  const [isRequestingMe, setIsRequestingMe] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState<FollowUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
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
      setIsFriend(data.isFriend);
      setIsRequestedByMe(data.isRequestedByMe || false);
      setIsRequestingMe(data.isRequestingMe || false);
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

  const handleFriendRequest = async () => {
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

      setIsFriend(true);
      setIsRequestedByMe(true);
    } catch (err) {
      console.error('Friend request error:', err);
      alert('フレンド申請に失敗しました');
    }
  };

  const handleRemoveFriend = async () => {
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

      setIsFriend(false);
    } catch (err) {
      console.error('Remove friend error:', err);
      alert('フレンド解除に失敗しました');
    }
  };

  const handleApproveRequest = async () => {
    try {
      const res = await fetch('/api/follows/requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: userId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '承認に失敗しました');
        return;
      }

      setIsRequestingMe(false);
      setIsFriend(true);
    } catch (err) {
      console.error('Approve friend request error:', err);
      alert('承認に失敗しました');
    }
  };

  const handleRejectRequest = async () => {
    try {
      const res = await fetch('/api/follows/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: userId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '拒否に失敗しました');
        return;
      }

      setIsRequestingMe(false);
    } catch (err) {
      console.error('Reject friend request error:', err);
      alert('拒否に失敗しました');
    }
  };

  const fetchFriends = async () => {
    try {
      setFriendsLoading(true);
      const res = await fetch(`/api/users/${userId}/followers`, {
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setFriends(data);
        setShowFriendsModal(true);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
      alert('フレンド一覧の取得に失敗しました');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleFriendRequestFromList = async (targetUserId: string) => {
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
      setFriends(friends.map(f => f.id === targetUserId ? { ...f, isFriend: true } : f));
    } catch (err) {
      console.error('Friend request error:', err);
      alert('フレンド申請に失敗しました');
    }
  };

  const handleRemoveFriendFromList = async (targetUserId: string) => {
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
      setFriends(friends.filter(f => f.id !== targetUserId));
    } catch (err) {
      console.error('Remove friend error:', err);
      alert('フレンド解除に失敗しました');
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
    <div className="min-h-screen bg-gray-900 pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 shadow-md" style={{ marginTop: 'calc(-1 * var(--safe-area-top))', paddingTop: 'calc(1rem + var(--safe-area-top))', position: 'sticky', top: 'calc(-1 * var(--safe-area-top))', zIndex: 40 }}>
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

              {/* フレンドボタン */}
              {isFriend ? (
                <button
                  onClick={handleRemoveFriend}
                  className="px-6 py-2 bg-gray-700 text-white rounded-full font-semibold hover:bg-red-600 transition border border-gray-600 hover:border-red-500"
                >
                  フレンド中
                </button>
              ) : isRequestingMe ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleApproveRequest}
                    className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-500 transition border border-green-500"
                  >
                    承認
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    className="px-4 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-500 transition border border-red-500"
                  >
                    拒否
                  </button>
                </div>
              ) : isRequestedByMe ? (
                <button
                  className="px-6 py-2 bg-gray-600 text-gray-200 rounded-full font-semibold border border-gray-500 cursor-not-allowed opacity-80"
                  disabled
                >
                  申請中
                </button>
              ) : (
                <button
                  onClick={handleFriendRequest}
                  className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-500 transition border border-green-500"
                >
                  フレンド申請
                </button>
              )}
            </div>
          </div>

          {/* レベル・ジェム情報 */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex gap-4 justify-start">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{user.level}</p>
              <p className="text-xs text-gray-400 mt-1">LV</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{user.gems}</p>
              <p className="text-xs text-gray-400 mt-1">💎 ジェム</p>
            </div>
          </div>

          {/* 統計 */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold text-white">{user._count.posts}</span>
              <span className="text-gray-400"> 投稿</span>
            </div>
            <button
              onClick={fetchFriends}
              className="hover:text-green-400 transition"
            >
              <span className="font-bold text-white">{user._count.friends}</span>
              <span className="text-gray-400"> 友達</span>
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

      {/* フレンドモーダル */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-96 flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">友達</h3>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {friendsLoading ? (
                <div className="p-4 text-center text-gray-400">読み込み中...</div>
              ) : friends.length === 0 ? (
                <div className="p-4 text-center text-gray-400">友達がいません</div>
              ) : (
                <div className="space-y-3 p-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded-lg transition cursor-pointer"
                      onClick={() => {
                        setShowFriendsModal(false);
                        router.push(`/user/${friend.id}`);
                      }}
                    >
                      <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-600">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-400">
                            {friend.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {friend.displayName || friend.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
                      </div>
                      <div>
                        {friend.isFriend ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFriendFromList(friend.id);
                            }}
                            className="px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-semibold hover:bg-red-600 transition border border-gray-600 hover:border-red-500"
                          >
                            フレンド中
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFriendRequestFromList(friend.id);
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
