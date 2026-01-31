'use client';


import { useState } from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { useTodayQuests } from '../hooks/useTodayQuests';



  const [isOpen, setIsOpen] = useState(false);
  const { quests, isLoading, mutate } = useTodayQuests();
  const completedCount = quests.filter(q => q.completed).length;
  const allCompleted = completedCount === quests.length && quests.length > 0;

  return (
    <>
      {/* トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all ${
          allCompleted
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 animate-pulse'
            : 'bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700'
        }`}
      >
        {allCompleted ? '🏆' : '✨'}
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <>
          {/* 背景 */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* スライドインパネル */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-gray-900 z-50 shadow-2xl overflow-y-auto border-l border-gray-700">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-700 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <span className="mr-2">✨</span>
                    今日のクエスト
                  </h2>
                  <p className="text-sm text-purple-200 mt-1">
                    デイリーチャレンジに挑戦しよう
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-purple-200 text-3xl w-10 h-10 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* 進捗バー */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-purple-200 mb-2">
                  <span>進捗状況</span>
                  <span className="font-bold">{completedCount} / {quests.length}</span>
                </div>
                <div className="w-full bg-purple-950 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all duration-500"
                    style={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* クエストリスト */}
            <PullToRefresh onRefresh={mutate}>
              <div className="p-6 space-y-4">
                {isLoading ? (
                  <p className="text-gray-400 text-center py-8">読み込み中...</p>
                ) : quests.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">クエストが見つかりません</p>
                ) : (
                  <>
                    {quests.map((quest, index) => (
                      <div
                        key={quest.id}
                        className={`p-5 rounded-xl border-2 transition-all ${
                          quest.completed
                            ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-600'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-bold text-purple-400 mr-3">
                                #{index + 1}
                              </span>
                              <h3 className="text-lg font-bold text-white">
                                {quest.title}
                              </h3>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {quest.description}
                            </p>
                            {quest.completed && quest.completedAt && (
                              <div className="mt-3 flex items-center text-green-400 text-sm">
                                <span className="mr-2">✓</span>
                                達成！{new Date(quest.completedAt).toLocaleTimeString('ja-JP', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {quest.completed ? (
                              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-2xl">
                                ✓
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-700 border-2 border-gray-600 rounded-full flex items-center justify-center text-gray-500">
                                <div className="w-6 h-6 border-2 border-gray-600 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 完了メッセージ */}
                    {allCompleted && (
                      <div className="mt-6 p-6 bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600 rounded-xl text-center">
                        <div className="text-5xl mb-3">🎉</div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">
                          全クエスト達成！
                        </h3>
                        <p className="text-yellow-200 text-sm">
                          今日のデイリーチャレンジを全てクリアしました！
                        </p>
                      </div>
                    )}

                    {/* ヒント */}
                    <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        💡 ヒント: 投稿ページで「✨ クエスト投稿」を選択し、クエストを選んで投稿すると達成できます。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </PullToRefresh>
          </div>
        </>
      )}
    </>
  );
}
