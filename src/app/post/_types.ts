// --- 型定義 ---

export interface Quest {
  id: number;
  title: string;
}

export interface ShotTokens {
  remaining: number;
  total: number;
}

export interface LimitInfo {
  limit: number;
  resetAt?: string;
}

export type FacingMode = 'user' | 'environment';
export type VisibilityScope = 'PUBLIC' | 'FRIENDS';
export type VisibilityDuration = number | 'unlimited';

export interface PostData {
  imageUrl: string;
  title?: string;
  caption: string;
  tags: string;
  visibilityScope: VisibilityScope;
  visibilityDuration: number | null;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  questId?: string;
}
