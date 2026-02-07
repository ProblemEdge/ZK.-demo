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

// 型とヘルパーのインポート
import type { MainTab, RankingType, Period, Mode, FriendFilter } from './_types';
import { getFilteredUsers } from './_helpers';

// カスタムフックのインポート
import { useDebounce } from './_hooks/useDebounce';
import { useUserSearch } from './_hooks/useUserSearch';
import { useRanking } from './_hooks/useRanking';
import { useFriendActions } from './_hooks/useFriendActions';

export default function DiscoverPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [mainTab, setMainTab] = useState<MainTab>('search');
  const [friendFilter, setFriendFilter] = useState<FriendFilter>('discover');
  
  // ランキング関連
  const [rankingType, setRankingType] = useState<RankingType>('level');
  const [period, setPeriod] = useState<Period>('all');
  const [mode, setMode] = useState<Mode>('world');

  // カスタムフックの使用
  const {
    users,
    setUsers,
    loading,
    userPage,
    hasMoreUsers,
    isLoadingMore,
    fetchUsers,
  } = useUserSearch(debouncedQuery, mainTab);

  const {
    ranking,
    rankingLoading,
    hasMoreRanking,
    fetchRanking,
    setRankingLoading,
  } = useRanking(mainTab, rankingType, period, mode);

  const {
    loadingUserIds,
    receivedRequests,
    requestsLoading,
    fetchReceivedRequests,
    handleFollow,
    handleUnfollow,
    handleApproveRequest,
    handleRejectRequest,
  } = useFriendActions(refresh, setUsers);

  // リクエスト取得
  useEffect(() => {
    if (mainTab === 'search' && friendFilter === 'request') {
      fetchReceivedRequests();
    }
  }, [friendFilter, mainTab, fetchReceivedRequests]);

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
  }, [userPage, hasMoreUsers, isLoadingMore, loading, mainTab, fetchUsers]);

  // フレンドフィルターを適用したユーザーリスト
  const displayedUsers = getFilteredUsers(users, friendFilter);

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
              <img src="/icon/User_icon.svg" alt="ユーザー" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-[20px] font-bold leading-none">ユーザー検索</span>
            </button>
            <button
              onClick={() => setMainTab('ranking')}
              className={`flex-1 h-[24px] rounded-[8px] flex items-center justify-center gap-[6px] ${
                mainTab === 'ranking' ? 'bg-[#00e676] text-white' : 'bg-[#475467] text-white'
              }`}
            >
              <img src="/icon/Award_icon.svg" alt="ランキング" className="w-5 h-5 rounded-full object-cover" />
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
                onClick={() => { setMode(mode === 'world' ? 'following' : 'world'); }}
                className="flex-1 h-[31px] border border-white rounded-[12px] flex items-center justify-center gap-2 text-white"
              >
                <img src="/icon/Refresh cw.svg" alt="" className="w-5 h-5 rounded-full object-cover" />
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
