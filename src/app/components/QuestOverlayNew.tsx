import React from "react";
import QuestDogtag from "./QuestDogtag";
import type { QuestStatusType } from "./QuestStatusTag";

interface QuestItem {
  id: string | number;
  title: string;
  description?: string;
  completed?: boolean;
  inProgress?: boolean;
  locked?: boolean;
}

interface QuestOverlayNewProps {
  open: boolean;
  quests: QuestItem[];
  selectedQuestId?: string | null;
  onSelect?: (questId: string) => void;
  onClose: () => void;
  onFallbackToNormal?: () => void;
}

export default function QuestOverlayNew({ 
  open, 
  quests, 
  selectedQuestId, 
  onSelect, 
  onClose, 
  onFallbackToNormal 
}: QuestOverlayNewProps) {
  if (!open) return null;

  // questのステータスを判定
  const getQuestStatus = (quest: QuestItem): QuestStatusType => {
    if (quest.locked) return "hidden";
    if (quest.completed) return "completed";
    if (quest.inProgress) return "in-progress";
    return "incomplete";
  };

  const handleQuestClick = (questId: string) => {
    if (onSelect) {
      onSelect(questId);
    }
    onClose();
  };
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#14161a] rounded-t-[32px] w-full max-w-[393px] pb-8 px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center gap-[5px] pt-4 mb-2">
          <img src="/icon/Compass_32.svg" alt="コンパス" className="w-8 h-8" />
          <h2 className="text-[#ffc400] text-[32px] font-bold text-center flex-1">
            デイリークエスト
          </h2>
        </div>
        
        {/* 区切り線 */}
        <div className="bg-[#ffc400] h-[2px] w-full mb-4" />
        
        {/* クエストリスト */}
        {quests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white mb-4">クエストがありません</p>
            {onFallbackToNormal && (
              <button
                onClick={() => {
                  onFallbackToNormal();
                  onClose();
                }}
                className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              >
                通常投稿に戻る
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[31px]">
            {quests.map((quest) => {
              const questId = String(quest.id);
              const status = getQuestStatus(quest);
              const isDisabled = quest.completed || quest.inProgress || quest.locked;
              
              return (
                <button
                  key={quest.id}
                  onClick={() => !isDisabled && handleQuestClick(questId)}
                  disabled={isDisabled}
                  className={`text-left transition ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                >
                  <QuestDogtag
                    title={quest.title}
                    description={quest.description || ''}
                    status={status}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
