// --- 型定義 ---
export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Quest {
  id: string;
  title: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: User;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  title?: string;
  caption: string;
  tags: string;
  postedAt: string;
  isApproved: boolean;
  rejectedAt: string | null;
  questId?: string | null;
  quest?: Quest | null;
  user: User;
  approveCount?: number;
  rejectCount?: number;
  totalVotes?: number;
  likeCount?: number;
  commentCount?: number;
  hasLiked?: boolean;
  hasVoted?: boolean;
}

export interface FeedResponse {
  voting: Post[];
  approved: Post[];
}

export type TabType = 'all' | 'following';
export type ViewTabType = 'feed' | 'map';
