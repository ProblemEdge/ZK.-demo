import PullToRefresh from 'react-pull-to-refresh';
import { useTodayQuests } from '../hooks/useTodayQuests';

export default function QuestList() {
  const { quests, mutate, isLoading } = useTodayQuests();

  return (
    <PullToRefresh onRefresh={mutate}>
      <div>
        {isLoading && <div>読み込み中...</div>}
        {quests.map((q: { id: string; title: string }) => (
          <div key={q.id}>{q.title}</div>
        ))}
      </div>
    </PullToRefresh>
  );
}
