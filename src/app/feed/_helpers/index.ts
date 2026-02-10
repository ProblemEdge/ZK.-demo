// --- ユーティリティ関数 ---

/**
 * 投票期限が切れているかどうかをチェック
 * @param postedAt 投稿日時
 * @returns 1時間以上経過している場合true
 */
export const isVotingClosed = (postedAt: string): boolean => {
  const postDate = new Date(postedAt);
  const now = new Date();
  return now.getTime() - postDate.getTime() > 60 * 60 * 1000; // 1時間
};

/**
 * 投票の残り時間を計算
 * @param postedAt 投稿日時
 * @returns 残り時間の表示文字列
 */
export const getTimeRemaining = (postedAt: string): string => {
  const postDate = new Date(postedAt);
  const expiryDate = new Date(postDate.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  if (diff <= 0) return '投票終了';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `残り ${hours}時間${mins}分`;
};
