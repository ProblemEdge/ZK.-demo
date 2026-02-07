'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProfileHeader from '../../components/ProfileHeader';
import ImageWithPlaceholder from '@/app/components/ImageWithPlaceholder';
import PostViewer from '../../components/PostViewer';
import Badges, { BadgeData } from '../../components/Badges';
import {
  getUserProfile,
  getUserBadges,
  getUserFollowers,
  followUser,
  unfollowUser,
  approveRequest,
  rejectRequest,
} from '@/actions/user';
import { useAuth } from '../../context/AuthContext';

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
  caption?: string;
  postedAt?: string;
}

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isFriend: boolean;
}

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [friends, setFriends] = useState<FollowUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isRequestedByMe, setIsRequestedByMe] = useState(false);
  const [isRequestingMe, setIsRequestingMe] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const router = useRouter();
  const params = useParams();
  const userId = (params as any).userId as string;
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!userId) return;
    fetchUser();
    fetchUserPosts();
    fetchUserBadges();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const data = await getUserProfile(userId);
      setUser((data as any).user || null);
      setIsFriend(Boolean((data as any).isFriend));
      setIsRequestedByMe(Boolean((data as any).isRequestedByMe));
      setIsRequestingMe(Boolean((data as any).isRequestingMe));
    } catch (err) {
      console.error(err);
      router.push('/discover');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/posts`, { cache: 'no-store', credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setPosts((data as Post[]) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const data = await getUserBadges(userId);
      setBadges((data as BadgeData[]) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriends = async () => {
    try {
      setFriendsLoading(true);
      const data = await getUserFollowers(userId);
      setFriends((data as FollowUser[]) || []);
      setShowFriendsModal(true);
    } catch (err) {
      console.error(err);
      alert('フレンド一覧の取得に失敗しました');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleFriendRequest = async () => {
    try {
      await followUser(userId);
      setIsRequestedByMe(true);
      setIsFriend(true);
    } catch (err) {
      console.error(err);
      alert('フレンド申請に失敗しました');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await unfollowUser(userId);
      setIsFriend(false);
      setIsRequestedByMe(false);
    } catch (err) {
      console.error(err);
      alert('フレンド解除に失敗しました');
    }
  };

  const handleApproveRequest = async () => {
    try {
      await approveRequest(userId);
      setIsRequestingMe(false);
      setIsFriend(true);
    } catch (err) {
      console.error(err);
      alert('承認に失敗しました');
    }
  };

  const handleRejectRequest = async () => {
    try {
      await rejectRequest(userId);
      setIsRequestingMe(false);
    } catch (err) {
      console.error(err);
      alert('拒否に失敗しました');
    }
  };

  const handleFriendRequestFromList = async (targetUserId: string) => {
    try {
      await followUser(targetUserId);
      setFriends(prev => prev.map(f => f.id === targetUserId ? { ...f, isFriend: true } : f));
    } catch (err) {
      console.error(err);
      alert('フレンド申請に失敗しました');
    }
  };

  const handleRemoveFriendFromList = async (targetUserId: string) => {
    try {
      await unfollowUser(targetUserId);
      setFriends(prev => prev.filter(f => f.id !== targetUserId));
    } catch (err) {
      console.error(err);
      alert('フレンド解除に失敗しました');
    }
  };

  if (!user) {
    // simple loading skeleton
    return (
      <div className="min-h-screen bg-[#0b0c0f] pb-24">
        <div className="sticky top-0 z-40 bg-[#0b0c0f]"><ProfileHeader /></div>
        <div className="mx-3 mt-4 bg-[#14161a] border border-white rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-[64px] h-[64px] bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-7 w-32 bg-gray-700 animate-pulse rounded mb-2"></div>
              <div className="h-5 w-24 bg-gray-700 animate-pulse rounded mb-3"></div>
              <div className="h-9 w-32 bg-gray-700 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
        {/* BottomNav moved to RootLayout */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c0f] pb-24" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="sticky top-0 z-40 bg-[#0b0c0f]">
        <ProfileHeader />
      </div>

      <div className="mx-3 mt-4 bg-[#14161a] border border-white rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-[64px] h-[64px] bg-[#bfbdbd] rounded-full overflow-hidden flex-shrink-0 border-2 border-white">
            {user.avatarUrl ? (
              (() => {
                const filename = user.avatarUrl.split('/').pop()?.split('?')[0];
                const fallback = filename ? `/uploads/avatars/${filename}` : undefined;
                let src = user.avatarUrl;
                try {
                  if (authUser && authUser.id === user.id) {
                    const vb = localStorage.getItem(`avatar_v_${user.id}`);
                    if (vb) src = `${src}${src.includes('?') ? '&' : '?'}v=${vb}`;
                  }
                } catch {}
                return (
                  <ImageWithPlaceholder
                    src={src}
                    alt={user.username}
                    showRandomText={false}
                    className="w-full h-full object-cover"
                    fallbackInitial={user.username[0].toUpperCase()}
                    fallbackSrc={fallback}
                  />
                );
              })()
            ) : (
              <span className="flex items-center justify-center w-full h-full text-2xl font-bold text-[#14161a]">{user.username[0].toUpperCase()}</span>
            )}
          </div>

          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-lg font-semibold truncate">{user.displayName || user.username}</h1>
              <div className="text-sm text-gray-400">@{user.username}</div>
            </div>

            {user.bio && <p className="mt-2 text-sm text-gray-300">{user.bio}</p>}

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-300">
              <div>{user._count.posts} posts</div>
              <button className="underline" onClick={fetchFriends}>{user._count.friends} friends</button>
            </div>

            <div className="mt-4">
              {authUser?.id === user.id ? (
                <button className="px-3 py-1 bg-white text-black rounded" onClick={() => router.push('/profile/edit')}>Edit profile</button>
              ) : isFriend ? (
                <button className="px-3 py-1 bg-gray-700 text-white rounded" onClick={handleRemoveFriend}>Unfriend</button>
              ) : isRequestedByMe ? (
                <button className="px-3 py-1 bg-gray-600 text-white rounded">Requested</button>
              ) : isRequestingMe ? (
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleApproveRequest}>Approve</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={handleRejectRequest}>Reject</button>
                </div>
              ) : (
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleFriendRequest}>Follow</button>
              )}
            </div>

            <div className="mt-4">
              <Badges badges={badges} />
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="mx-3 mt-4 grid grid-cols-3 gap-2">
        {posts.map((p, i) => {
          return (
            <button key={p.id} className="w-full aspect-square rounded overflow-hidden bg-black" onClick={() => { setViewerIndex(i); setViewerOpen(true); }}>
              <ImageWithPlaceholder src={p.imageUrl} alt={p.caption || ''} className="w-full h-full object-cover" showRandomText={true} />
            </button>
          );
        })}
      </div>

      {viewerOpen && (
        <PostViewer posts={posts} initialIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}

      {showFriendsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#14161a] rounded-lg p-4 w-[90%] max-w-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white">Friends</h3>
              <button className="text-white" onClick={() => setShowFriendsModal(false)}>✕</button>
            </div>
            <div className="space-y-3">
              {friendsLoading ? <div className="text-gray-400">Loading...</div> : (
                friends.map(f => (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                      {f.avatarUrl ? <img src={f.avatarUrl} alt={f.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white">{f.username[0].toUpperCase()}</div>}
                    </div>
                    <div className="flex-1">
                      <div className="text-white">{f.displayName || f.username}</div>
                      <div className="text-sm text-gray-400">@{f.username}</div>
                    </div>
                    <div>
                      {f.isFriend ? (
                        <button className="px-2 py-1 bg-gray-700 text-white rounded" onClick={() => handleRemoveFriendFromList(f.id)}>Unfriend</button>
                      ) : (
                        <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => handleFriendRequestFromList(f.id)}>Follow</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

        {/* BottomNav moved to RootLayout */}
    </div>

  ); // ここを閉じ忘れると構文エラーになります
}