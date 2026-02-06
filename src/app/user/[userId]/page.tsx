'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BottomNav from '../../components/BottomNav';
import ProfileHeader from '../../components/ProfileHeader';
import PostViewer from '../../components/PostViewer';
import Badges, { BadgeData } from '../../components/Badges';
import { 
  getUserProfile,
  getUserBadges,
  getUserFollowers,
  followUser,
  unfollowUser,
  approveRequest,
  rejectRequest
} from '@/actions/user';

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
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState<FollowUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserPosts();
      fetchUserBadges();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const data = await getUserProfile(userId);
      setUser((data as any).user);
      setIsFriend((data as any).isFriend);
      setIsRequestedByMe((data as any).isRequestedByMe || false);
      setIsRequestingMe((data as any).isRequestingMe || false);
    } catch (err) {
      console.error('Error fetching user:', err);
      router.push('/discover');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/posts`, { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('投稿の取得に失敗しました');
      const data = await res.json();
      setPosts(data as Post[]);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const data = await getUserBadges(userId);
      setBadges(data as BadgeData[]);
    } catch (err) {
      console.error('Error fetching badges:', err);
    }
  };

  const handleFriendRequest = async () => {
    try {
      await followUser(userId);
      setIsFriend(true);
      setIsRequestedByMe(true);
    } catch (err) {
      console.error('Friend request error:', err);
      alert('フレンド申請に失敗しました');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await unfollowUser(userId);
      setIsFriend(false);
      setIsRequestedByMe(false);
      if (user) {
        setUser({ ...user, _count: { ...user._count, friends: Math.max(0, user._count.friends - 1) } });
      }
    } catch (err) {
      console.error('Remove friend error:', err);
      alert('フレンド解除に失敗しました');
    }
  };

  const handleApproveRequest = async () => {
    try {
      await approveRequest(userId);
      setIsRequestingMe(false);
      setIsFriend(true);
      if (user) {
        setUser({ ...user, _count: { ...user._count, friends: user._count.friends + 1 } });
      }
    } catch (err) {
      console.error('Approve friend request error:', err);
      alert('承認に失敗しました');
    }
  };

  const handleRejectRequest = async () => {
    try {
      await rejectRequest(userId);
      setIsRequestingMe(false);
      if (user) {
        setUser({ ...user, _count: { ...user._count, friends: Math.max(0, user._count.friends - 1) } });
      }
    } catch (err) {
      console.error('Reject friend request error:', err);
      alert('拒否に失敗しました');
    }
  };

  const fetchFriends = async () => {
    try {
      setFriendsLoading(true);
      const data = await getUserFollowers(userId);
      setFriends(data as FollowUser[]);
      setShowFriendsModal(true);
    } catch (err) {
      console.error('Error fetching friends:', err);
      alert('フレンド一覧の取得に失敗しました');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleFriendRequestFromList = async (targetUserId: string) => {
    try {
      await followUser(targetUserId);
      setFriends(friends.map(f => f.id === targetUserId ? { ...f, isFriend: true } : f));
    } catch (err) {
      console.error('Friend request error:', err);
      alert('フレンド申請に失敗しました');
    }
  };

  const handleRemoveFriendFromList = async (targetUserId: string) => {
    try {
      await unfollowUser(targetUserId);
      setFriends(friends.filter(f => f.id !== targetUserId));
    } catch (err) {
      console.error('Remove friend error:', err);
      alert('フレンド解除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f] pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="sticky top-0 z-40 bg-[#0b0c0f]">
        <ProfileHeader />
      </div>

      {!user ? (
        // ローディングスケルトン
        <div className="mx-3 mt-4 bg-[#14161a] border border-white rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-[64px] h-[64px] bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-7 w-32 bg-gray-700 animate-pulse rounded mb-2"></div>
              <div className="h-5 w-24 bg-gray-700 animate-pulse rounded mb-3"></div>
              <div className="h-9 w-32 bg-gray-700 animate-pulse rounded"></div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-700 animate-pulse rounded"></div>
                <div>
                  <div className="h-6 w-12 bg-gray-700 animate-pulse rounded mb-1"></div>
                  <div className="h-3 w-8 bg-gray-700 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      {/* Profile Details Card */}
      <div className="mx-3 mt-4 bg-[#14161a] border border-white rounded-2xl p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-[64px] h-[64px] bg-[#bfbdbd] rounded-full overflow-hidden flex-shrink-0 border-2 border-white">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-2xl font-bold text-[#14161a]">
                {user.username[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h1 className="text-[24px] font-bold text-white truncate">
                {user.displayName || user.username}
              </h1>
            </div>
            <p className="text-[16px] text-[#bfbdbd] mb-2">@{user.username}</p>
            
            {user.bio && (
              <p className="text-[14px] text-white mb-3">{user.bio}</p>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="mb-3">
                <Badges badges={badges} size="sm" />
              </div>
            )}

            {/* Friend Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {isFriend ? (
                <>
                  <span className="text-xs font-bold text-[#00e676] bg-[#00e676]/20 px-2 py-1 rounded-full">
                    ✓ フレンド
                  </span>
                  <button
                    onClick={handleRemoveFriend}
                    className="px-4 py-1.5 bg-[#475467] text-white rounded-full text-sm font-bold hover:bg-red-600 transition border border-white"
                  >
                    フレンド解除
                  </button>
                </>
              ) : isRequestingMe ? (
                <>
                  <span className="text-xs font-bold text-[#ffc107] bg-[#ffc107]/20 px-2 py-1 rounded-full">
                    ⏳ 承認待ち
                  </span>
                  <button
                    onClick={handleApproveRequest}
                    className="px-3 py-1.5 bg-[#00e676] text-white rounded-full text-sm font-bold hover:bg-[#00d664] transition border border-white"
                  >
                    承認
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-500 transition border border-white"
                  >
                    拒否
                  </button>
                </>
              ) : isRequestedByMe ? (
                <>
                  <span className="text-xs font-bold text-[#ffc107] bg-[#ffc107]/20 px-2 py-1 rounded-full">
                    ⏳ 申請中
                  </span>
                  <button
                    className="px-4 py-1.5 bg-[#475467] text-white rounded-full text-sm font-bold border border-white opacity-60 cursor-not-allowed"
                    disabled
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFriendRequest}
                  className="px-4 py-1.5 bg-[#00e676] text-white rounded-full text-sm font-bold hover:bg-[#00d664] transition border border-white"
                >
                  + フレンド申請
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/icon/level_icon.svg" alt="Level" className="w-5 h-5" />
            <div>
              <p className="text-[20px] font-bold text-[#ff6d00] leading-none">{user.level}</p>
              <p className="text-[10px] text-[#bfbdbd] mt-0.5">LV</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img src="/icon/Gem_Icon.png" alt="Gems" className="w-5 h-5" />
            <div>
              <p className="text-[20px] font-bold text-[#09ffe2] leading-none">{user.gems}</p>
              <p className="text-[10px] text-[#bfbdbd] mt-0.5">ジェム</p>
            </div>
          </div>
          <button
            onClick={fetchFriends}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div>
              <p className="text-[20px] font-bold text-white leading-none">{user._count.friends}</p>
              <p className="text-[10px] text-[#bfbdbd] mt-0.5">友達</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-[20px] font-bold text-white leading-none">{user._count.posts}</p>
              <p className="text-[10px] text-[#bfbdbd] mt-0.5">投稿</p>
            </div>
          </div>
        </div>
      </div>

      {/* 投稿セクション */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-4">投稿</h2>
          
        {posts.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <p className="text-gray-400">投稿がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map((post, i) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-500 transition cursor-pointer aspect-square"
                onClick={() => { setViewerIndex(i); setViewerOpen(true); }}
              >
                <img
                  src={`/api/posts/${post.id}/image`}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
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
        </>
      )}

      <BottomNav />
      {viewerOpen && (
        <PostViewer posts={posts.map(p => ({ ...p, imageUrl: `/api/posts/${p.id}/image` }))} initialIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  );
}
