// --- 型定義 ---

export interface User {
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

export interface RankingUser {
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

export type MainTab = 'search' | 'ranking';
export type RankingType = 'level' | 'gems' | 'votes' | 'likes';
export type Period = 'all' | 'today' | 'week' | 'month' | 'year';
export type Mode = 'world' | 'following';
export type FriendFilter = 'discover' | 'friend' | 'pending' | 'request';
