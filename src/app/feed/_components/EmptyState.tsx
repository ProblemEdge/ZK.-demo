interface EmptyStateProps {
  onCreatePost: () => void;
}

/**
 * 投稿が0件の場合の空状態コンポーネント
 */
export default function EmptyState({ onCreatePost }: EmptyStateProps) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <p className="text-white text-lg">投稿がありません</p>
      <button 
        onClick={onCreatePost} 
        className="px-6 py-2 bg-green-700 text-white rounded-full"
      >
        投稿を作成
      </button>
    </div>
  );
}
