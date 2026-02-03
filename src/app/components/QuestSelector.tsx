'use client';

interface QuestSelectorProps {
  open: boolean;
  quests: any[];
  selectedQuestId: string | null;
  onSelect: (questId: string) => void;
  onClose: () => void;
  onFallbackToNormal: () => void;
}

export default function QuestSelector({
  open,
  quests,
  selectedQuestId,
  onSelect,
  onClose,
  onFallbackToNormal
}: QuestSelectorProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl bg-[#0B0C0F] rounded-t-2xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold">クエストを選択</p>
          <button onClick={onClose} className="text-gray-300">閉じる</button>
        </div>

        {quests.length === 0 ? (
          <div className="text-center text-gray-300 py-6">
            <p className="mb-3">クエストがありません</p>
            <button
              onClick={onFallbackToNormal}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white"
            >
              通常投稿に戻る
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {quests.map((quest) => (
              <button
                key={quest.id}
                type="button"
                onClick={() => {
                  onSelect(quest.id);
                  onClose();
                }}
                disabled={quest.completed || quest.inProgress || quest.locked}
                className={`w-full p-3 rounded-lg text-left transition border ${
                  selectedQuestId === quest.id
                    ? 'bg-blue-600 text-white border-blue-400'
                    : quest.completed
                    ? 'bg-gray-700/50 text-gray-500 border-gray-600 cursor-not-allowed'
                    : quest.inProgress
                    ? 'bg-yellow-900/30 text-yellow-300 border-yellow-600 cursor-not-allowed'
                    : quest.locked
                    ? 'bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{quest.title}</p>
                    <p className="text-xs opacity-80 mt-1">{quest.description}</p>
                    {quest.inProgress && (
                      <p className="text-xs text-yellow-400 mt-1">⏳ 投票中...</p>
                    )}
                    {quest.locked && (
                      <p className="text-xs text-gray-400 mt-1">🔒 次の時間帯に開放</p>
                    )}
                  </div>
                  {quest.completed && (
                    <span className="text-green-400 text-xl ml-2">✓</span>
                  )}
                  {quest.inProgress && (
                    <span className="text-yellow-400 text-xl ml-2">⏳</span>
                  )}
                  {quest.locked && (
                    <span className="text-gray-500 text-xl ml-2">🔒</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
