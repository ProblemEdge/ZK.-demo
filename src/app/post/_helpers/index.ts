// --- ヘルパー関数 ---

/**
 * Data URLをFileオブジェクトに変換
 */
export const dataUrlToFile = (dataUrl: string, filename: string): File | null => {
  const arr = dataUrl.split(',');
  if (arr.length < 2) return null;
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * 編集内容があるかチェック
 */
export const hasEdits = (params: {
  imageDataUrl: string;
  title: string;
  caption: string;
  selectedTags: string[];
  visibilityScope: string;
  visibilityDuration: number | 'unlimited';
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  isQuestMode: boolean;
  selectedQuestId: string | null;
}): boolean => {
  return Boolean(
    params.imageDataUrl ||
      params.title ||
      params.caption ||
      params.selectedTags.length ||
      params.visibilityScope !== 'PUBLIC' ||
      params.visibilityDuration !== 1440 ||
      params.latitude !== null ||
      params.longitude !== null ||
      params.locationName ||
      params.isQuestMode ||
      params.selectedQuestId
  );
};

/**
 * 離脱確認
 */
export const confirmLeave = (hasEdits: boolean): boolean => {
  if (!hasEdits) return true;
  return window.confirm('編集中の内容は破棄されます。よろしいですか？');
};
