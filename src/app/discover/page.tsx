'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import UserDogtag from '../components/UserDogtag';
import DiscoverHeader from '../components/DiscoverHeader';
import { RankFirstFrame, RankSecondFrame, RankThirdFrame, RankListFrame } from '../components/RankingFrames';
import StatButton from '../components/StatButton';
import DiscoverFilterTabs from '../components/DiscoverFilterTabs';
import { useAuth } from '../context/AuthContext';
import { FriendAddButton, FriendingButton, FriendReqingButton } from '../components/FriendButtons';
interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  gems: number;
  _count: {
    posts: number;
    friends: number;
  };
  isFriend: boolean;
  isRequested?: boolean;
  isReceivedRequest?: boolean;
}

interface RankingUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  gems: number;
  totalVotes?: number;
  totalLikes?: number;
  avgCompletionTime?: number;
  completedCount?: number;
}

type MainTab = 'search' | 'ranking';
type RankingType = 'level' | 'gems' | 'votes' | 'likes';
type Period = 'all' | 'today' | 'week' | 'month' | 'year';
type Mode = 'world' | 'following';
type FriendFilter = 'discover' | 'friend' | 'pending' | 'request';

export default function DiscoverPage() {
  const { refresh } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [mainTab, setMainTab] = useState<MainTab>('search');
  const [friendFilter, setFriendFilter] = useState<FriendFilter>('discover');
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [receivedRequests, setReceivedRequests] = useState<User[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // ページング関連
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // ランキング関連
  const [rankingType, setRankingType] = useState<RankingType>('level');
  const [period, setPeriod] = useState<Period>('all');
  const [mode, setMode] = useState<Mode>('world');
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingPage, setRankingPage] = useState(1);
  const [hasMoreRanking, setHasMoreRanking] = useState(true);
  
  const router = useRouter();

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ユーザー検索
  useEffect(() => {
    if (mainTab === 'search') {
      setUserPage(1);
      setHasMoreUsers(true);
      fetchUsers(1);
    }
  }, [debouncedQuery, mainTab]);

  // リクエスト取得
  useEffect(() => {
    if (mainTab === 'search' && friendFilter === 'request') {
      fetchReceivedRequests();
    }
  }, [friendFilter, mainTab]);

  // 無限スクロール検出
  useEffect(() => {
    if (mainTab !== 'search' || !hasMoreUsers || isLoadingMore || loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchUsers(userPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [userPage, hasMoreUsers, isLoadingMore, loading, mainTab]);

  // ランキング取得
  useEffect(() => {
    if (mainTab === 'ranking') {
      setRankingPage(1);
      setHasMoreRanking(true);
      setRankingLoading(false); // ローディング状態をリセット
      fetchRanking(true);
    }
  }, [rankingType, period, mode, mainTab]);

  const fetchRanking = async (reset: boolean = false) => {
    if (rankingLoading || (!reset && !hasMoreRanking)) return;
    
    try {
      setRankingLoading(true);
      const currentPage = reset ? 1 : rankingPage;
      
      const res = await fetch(
        `/api/rankings?type=${rankingType}&period=${period}&mode=${mode}&page=${currentPage}&limit=10`,
        { cache: 'no-store' }
      );

      if (!res.ok) throw new Error('ランキングの取得に失敗しました');

      const data = await res.json();
      
      if (reset) {
        setRanking(data.ranking);
      } else {
        setRanking([...ranking, ...data.ranking]);
      }
      
      setHasMoreRanking(data.ranking.length === 10 && currentPage < 10); // 最大100位まで（10ページ）
      if (!reset) {
        setRankingPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Ranking error:', err);
      setRanking([]);
    } finally {
      setRankingLoading(false);
    }
  };

  const fetchUsers = async (page: number = userPage) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const query = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : '';
      const separator = query ? '&' : '?';
      const url = `/api/users${query}${separator}limit=10&offset=${(page - 1) * 10}`;
      
      const res = await fetch(url, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('ユーザーの取得に失敗しました');
      }

      const data = await res.json();
      
      if (page === 1) {
        setUsers(data);
      } else {
        // 既に存在するユーザーを除外して追加
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = data.filter((u: User) => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
      }
      
      setHasMoreUsers(data.length === 10);
      setUserPage(page);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (page === 1) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch('/api/friends/requests/received', {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('リクエストの取得に失敗しました');
      }

      const data = await res.json();
      // APIから返されるデータはすでにUser型の形式なので、そのまま使用
      setReceivedRequests(data);
    } catch (err) {
      console.error('Error fetching received requests:', err);
      setReceivedRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // フレンドフィルターを適用したユーザーリスト
  const filteredUsers = users.filter(user => {
    if (friendFilter === 'discover') return !user.isFriend && !user.isRequested && !user.isReceivedRequest;
    if (friendFilter === 'friend') return user.isFriend === true;
    if (friendFilter === 'pending') return user.isRequested === true;
    if (friendFilter === 'request') return false; // リクエストは別途で表示
    return true;
  });

  // 発見タブはフィルター無しで表示、他は filteredUsers を使用
  // 重複を排除
  const uniqueDisplayedUsers = Array.from(
    new Map(filteredUsers.map(user => [user.id, user])).values()
  );
  const displayedUsers = uniqueDisplayedUsers;

  const handleFollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(targetUserId));
    try {
      const res = await fetch('/api/follows/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Follow error response:', data);
        alert(data.error || 'フォローに失敗しました');
        return;
      }

      // UIを更新：最新の状態を使用
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === targetUserId ? { ...u, isFriend: false, isRequested: true } : u)
      );
    } catch (err) {
      console.error('Follow error:', err);
      alert('フォローに失敗しました');
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const handleUnfollow = async (targetUserId: string, e: React.MouseEvent, isRequest: boolean = false) => {
    e.stopPropagation();
    
    // 申請中の削除ではなく、友達削除の場合のみ確認
    if (!isRequest && !confirm('本当にこのユーザーとの友達関係を削除しますか？')) {
      return;
    }
    
    setLoadingUserIds(prev => new Set(prev).add(targetUserId));
    try {
      // 申請中の場合は cancel エンドポイント（targetUserId指定で送信済みリクエスト削除）
      // 友達削除は unfollow を使う
      const endpoint = isRequest ? '/api/friends/requests/cancel' : '/api/follows/unfollow';
      const bodyData = isRequest ? { targetUserId } : { targetUserId };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('API Error:', errorMessage);
        return;
      }

      // UIを更新：最新の状態を使用
      setUsers(prevUsers =>
        prevUsers.map(u => u.id === targetUserId ? { ...u, isFriend: false, isRequested: false } : u)
      );
      
      // ユーザー認証情報を更新（friendCountを再計算）
      await refresh();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const handleApproveRequest = async (requesterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(requesterId));
    try {
      const res = await fetch('/api/friends/requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Approve error response:', data);
        alert(data.error || '承認に失敗しました');
        return;
      }

      // UIを更新：最新の状態を使用
      setReceivedRequests(prevRequests => prevRequests.filter(r => r.id !== requesterId));
      setUsers(prevUsers => prevUsers.filter(u => u.id !== requesterId));
      
      // ユーザー認証情報を更新（friendCountを再計算）
      await refresh();
    } catch (err) {
      console.error('Approve error:', err);
      alert('承認に失敗しました');
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requesterId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requesterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUserIds(prev => new Set(prev).add(requesterId));
    try {
      const res = await fetch('/api/friends/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId })
      });

      if (!res.ok) {
        console.error('Reject error response:', res);
        return;
      }

      // UIを更新：最新の状態を使用
      setReceivedRequests(prevRequests => prevRequests.filter(r => r.id !== requesterId));
      
      // users配列から完全に削除（リロード後も表示されないようにする）
      setUsers(prevUsers => prevUsers.filter(u => u.id !== requesterId));
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setLoadingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requesterId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0f]" style={{ paddingBottom: 'calc(6rem + var(--safe-area-bottom))' }}>
      <div className="sticky top-0 z-40 bg-[#0b0c0f]">
        <DiscoverHeader mainTab={mainTab} />

        <div className="px-3">
          <div className="bg-[#1d1e21] rounded-[8px] h-[32px] flex items-center justify-center gap-2 px-2">
            <button
              onClick={() => setMainTab('search')}
              className={`flex-1 h-[24px] rounded-[8px] flex items-center justify-center gap-[6px] ${
                mainTab === 'search' ? 'bg-[#00e676] text-white' : 'bg-[#475467] text-white'
              }`}
            >
              <img src="/icon/User_icon.svg" alt="ユーザー" className="w-5 h-5" />
              <span className="text-[20px] font-bold leading-none">ユーザー検索</span>
            </button>
            <button
              onClick={() => setMainTab('ranking')}
              className={`flex-1 h-[24px] rounded-[8px] flex items-center justify-center gap-[6px] ${
                mainTab === 'ranking' ? 'bg-[#00e676] text-white' : 'bg-[#475467] text-white'
              }`}
            >
              <img src="/icon/Award_icon.svg" alt="ランキング" className="w-5 h-5" />
              <span className="text-[20px] font-bold leading-none">ランキング</span>
            </button>
          </div>
        </div>

        <div className="bg-[#14161a] h-[4px] w-full mt-3" />

        {/* 検索バー（検索タブ時のみ） */}
        {mainTab === 'search' && (
          <div className="px-3 mt-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ユーザー名/プロフィール名を入力"
                className="w-full h-[38px] px-3 pr-10 bg-[#14161a] text-white placeholder-[#475467] border border-white rounded-[4px] focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
                  <path d="M20 20L16.65 16.65" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          </div>
        )}

        {/* ランキングフィルター（ランキングタブ時のみ） */}
        {mainTab === 'ranking' && (
          <>
            <div className="bg-[#14161a] h-[4px] w-full" />
            
            <div className="px-1 flex items-center justify-center gap-0 overflow-x-auto py-0">
              <StatButton 
                type="level" 
                label="レベル" 
                onClick={() => { 
                  console.log('Level button clicked');
                  setRankingType('level');
                }}
                active={rankingType === 'level'}
              />
              <StatButton 
                type="gem" 
                label="ジェム" 
                onClick={() => setRankingType('gems')}
                active={rankingType === 'gems'}
              />
              <StatButton 
                type="votes" 
                label="投票数" 
                onClick={() => setRankingType('votes')}
                active={rankingType === 'votes'}
              />
              <StatButton 
                type="likes" 
                label="いいね" 
                onClick={() => setRankingType('likes')}
                active={rankingType === 'likes'}
              />
            </div>

            <div className="px-3 mt-2 flex gap-2">
              <select
                value={period}
                onChange={(e) => { setRankingLoading(true); setPeriod(e.target.value as Period); }}
                className="flex-1 h-[31px] border border-white rounded-[12px] bg-[#0b0c0f] text-white text-[16px] font-bold px-3 appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'url(/icon/Chevron_down.svg)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 4px center',
                  backgroundSize: '24px 24px'
                }}
              >
                <option value="all" className="bg-[#0b0c0f] text-white">全期間</option>
                <option value="today" className="bg-[#0b0c0f] text-white">今日</option>
                <option value="week" className="bg-[#0b0c0f] text-white">今週</option>
                <option value="month" className="bg-[#0b0c0f] text-white">今月</option>
                <option value="year" className="bg-[#0b0c0f] text-white">今年</option>
              </select>
              <button
                onClick={() => { setRankingLoading(true); setMode(mode === 'world' ? 'following' : 'world'); }}
                className="flex-1 h-[31px] border border-white rounded-[12px] flex items-center justify-center gap-2 text-white"
              >
                <img src="/icon/Refresh cw.svg" alt="" className="w-5 h-5" />
                <span className="text-[20px] font-bold">{mode === 'world' ? '世界' : '友達'}</span>
              </button>
            </div>
          </>
        )}
        <div className="bg-[#14161a] h-[4px] w-full mt-3" />
      </div>

      <div className="px-3 pt-3 max-w-2xl mx-auto">
        {/* 検索タブコンテンツ */}
        {mainTab === 'search' && (
          <>
            {/* フレンドステータスフィルター */}
            <DiscoverFilterTabs 
              activeFilter={friendFilter}
              onFilterChange={(filter) => setFriendFilter(filter as FriendFilter)}
            />

            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-400">検索中...</p>
              </div>
            )}

            {friendFilter === 'discover' && !loading && users.length === 0 && debouncedQuery !== '' && (
              <div className="text-center py-12">
                <p className="text-gray-400">「{debouncedQuery}」に該当するユーザーが見つかりません</p>
              </div>
            )}

            {friendFilter !== 'discover' && friendFilter !== 'request' && !loading && displayedUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">該当するユーザーがいません</p>
              </div>
            )}

            {friendFilter === 'request' && !requestsLoading && receivedRequests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">リクエストがありません</p>
              </div>
            )}

            {!loading && displayedUsers.length > 0 && (
              <div className="space-y-2">
                {displayedUsers.map((user) => (
                  <div key={user.id} onClick={() => router.push(`/user/${user.id}`)} className="cursor-pointer">
                    <UserDogtag
                      name={user.displayName || user.username}
                      username={user.username}
                      level={user.level}
                      gems={user.gems}
                      posts={user._count.posts}
                      friends={user._count.friends}
                      avatarUrl={user.avatarUrl}
                      button={
                        friendFilter === 'discover' && (
                          <FriendAddButton
                            disabled={loadingUserIds.has(user.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollow(user.id, e);
                            }}
                          />
                        ) || friendFilter === 'friend' && (
                          <FriendingButton
                            disabled={loadingUserIds.has(user.id)}
                            isHovered={true}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollow(user.id, e);
                            }}
                          />
                        ) || friendFilter === 'pending' && (
                          <FriendReqingButton
                            disabled={loadingUserIds.has(user.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnfollow(user.id, e, true);
                            }}
                          />
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {!requestsLoading && friendFilter === 'request' && receivedRequests.length > 0 && (
              <div className="space-y-2">
                {Array.from(new Map(receivedRequests.map(u => [u.id, u])).values()).map((user) => (
                  <div key={user.id} onClick={() => router.push(`/user/${user.id}`)} className="cursor-pointer">
                    <UserDogtag
                      name={user.displayName || user.username}
                      username={user.username}
                      level={user.level}
                      gems={user.gems}
                      posts={user._count.posts}
                      friends={user._count.friends}
                      avatarUrl={user.avatarUrl}
                      button={
                        <div className="flex gap-2">
                          <button
                            disabled={loadingUserIds.has(user.id)}
                            onClick={(e) => handleApproveRequest(user.id, e)}
                            className="px-3 py-1 bg-[#00e676] text-white rounded-[6px] text-sm font-bold hover:bg-[#00c853] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            承認
                          </button>
                          <button
                            disabled={loadingUserIds.has(user.id)}
                            onClick={(e) => handleRejectRequest(user.id, e)}
                            className="px-3 py-1 bg-[#ff5252] text-white rounded-[6px] text-sm font-bold hover:bg-[#ff1744] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            拒否
                          </button>
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {isLoadingMore && (
              <div className="text-center py-4">
                <p className="text-gray-400">読み込み中...</p>
              </div>
            )}

            <div id="scroll-sentinel" className="h-1" />
          </>
        )}

        {/* ランキングタブコンテンツ */}
        {mainTab === 'ranking' && (
          <>
            {rankingLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e676] mb-2"></div>
                <p className="text-gray-400">読み込み中...</p>
              </div>
            )}

            {!rankingLoading && ranking.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">ランキングデータがありません</p>
              </div>
            )}

            {!rankingLoading && ranking.length > 0 && (
              <>
                {/* 1位〜3位の特別表示 */}
                <div className="flex flex-col items-center gap-2 mb-3">
                  {ranking[0] && (
                    <div className="w-[148px]">
                      <RankFirstFrame
                        name={ranking[0].displayName || ranking[0].username}
                        username={ranking[0].username}
                        level={ranking[0].level}
                        avatarUrl={ranking[0].avatarUrl}
                        onClick={() => router.push(`/user/${ranking[0].id}`)}
                        rankingType={rankingType}
                        score={rankingType === 'gems' ? ranking[0].gems : rankingType === 'votes' ? ranking[0].totalVotes : ranking[0].totalLikes}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-6 items-start">
                    {ranking[1] && (
                      <div className="w-[128px]">
                        <RankSecondFrame
                          name={ranking[1].displayName || ranking[1].username}
                          username={ranking[1].username}
                          level={ranking[1].level}
                          avatarUrl={ranking[1].avatarUrl}
                          onClick={() => router.push(`/user/${ranking[1].id}`)}
                          rankingType={rankingType}
                          score={rankingType === 'gems' ? ranking[1].gems : rankingType === 'votes' ? ranking[1].totalVotes : ranking[1].totalLikes}
                        />
                      </div>
                    )}
                    
                    {ranking[2] && (
                      <div className="w-[128px]">
                        <RankThirdFrame
                          name={ranking[2].displayName || ranking[2].username}
                          username={ranking[2].username}
                          level={ranking[2].level}
                          avatarUrl={ranking[2].avatarUrl}
                          onClick={() => router.push(`/user/${ranking[2].id}`)}
                          rankingType={rankingType}
                          score={rankingType === 'gems' ? ranking[2].gems : rankingType === 'votes' ? ranking[2].totalVotes : ranking[2].totalLikes}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4位以降のリスト表示 */}
                <div className="space-y-2 w-full">
                  {ranking.slice(3).map((user, index) => (
                    <RankListFrame
                      key={user.id}
                      rank={index + 4}
                      name={user.displayName || user.username}
                      username={user.username}
                      level={user.level}
                      avatarUrl={user.avatarUrl}
                      onClick={() => router.push(`/user/${user.id}`)}
                      rankingType={rankingType}
                      score={rankingType === 'gems' ? user.gems : rankingType === 'votes' ? user.totalVotes : user.totalLikes}
                    />
                  ))}
                </div>

                {/* もっと読み込むボタン */}
                {hasMoreRanking && !rankingLoading && (
                  <div className="text-center py-4">
                    <button
                      onClick={() => fetchRanking(false)}
                      className="px-6 py-2 bg-[#00e676] text-white rounded-lg font-bold hover:opacity-80"
                    >
                      もっと読み込む
                    </button>
                  </div>
                )}

                {rankingLoading && ranking.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400">読み込み中...</p>
                  </div>
                )}

                {!hasMoreRanking && ranking.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">すべてのランキングを表示しました</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
