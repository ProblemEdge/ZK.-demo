import { prisma } from '@/lib/prisma';
import { QUEST_POOL } from '@/lib/questTemplates';

export const RELEASE_HOURS = [7, 12, 17];

// 今日の0時を取得（日本時刻）
export function getTodayMidnight(): Date {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayJst = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
  return new Date(todayJst.getTime() - 9 * 60 * 60 * 1000);
}

// 現在時刻（日本時刻）を取得
export function getCurrentJSTHour(): number {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.getUTCHours();
}

// クエストを作成（存在しない場合のみ）
export async function createQuestWave(today: Date, waveIndex: number): Promise<any[]> {
  const quests: any[] = [];

  // すべてのテンプレートからランダムに1つ選ぶ（朝昼夜で別ソースは不要）
  if (QUEST_POOL.length === 0) return quests;

  const randIndex = Math.floor(Math.random() * QUEST_POOL.length);
  const template = QUEST_POOL[randIndex];
  const order = waveIndex;

  try {
    const newQuest = await prisma.dailyQuest.create({
      data: {
        title: template.title,
        description: template.description,
        date: today,
        order: order,
      },
    });
    quests.push(newQuest);
  } catch (error: any) {
    if (error.code === 'P2002') {
      const existing = await prisma.dailyQuest.findUnique({
        where: {
          date_order: {
            date: today,
            order: order,
          },
        },
      });
      if (existing) quests.push(existing);
    } else {
      throw error;
    }
  }

  return quests;
}

// 今日のクエストを取得（時間に応じて段階的にロック解除）
export async function getTodayQuestsWithLocking(): Promise<{
  quests: any[];
  lockedQuests: any[];
  newWaves: number[];
}> {
  const today = getTodayMidnight();
  const currentHour = getCurrentJSTHour();

  let availableWaveIndices: number[] = [];
  let lockedWaveIndices: number[] = [];

  if (currentHour < 7) {
    lockedWaveIndices = [0, 1, 2];
  } else if (currentHour < 12) {
    availableWaveIndices = [0];
    lockedWaveIndices = [1, 2];
  } else if (currentHour < 17) {
    availableWaveIndices = [0, 1];
    lockedWaveIndices = [2];
  } else {
    availableWaveIndices = [0, 1, 2];
  }

  const existingQuests = await prisma.dailyQuest.findMany({
    where: { date: today },
    orderBy: { order: 'asc' },
  });

  const newWaves: number[] = [];
  let allQuests = [...existingQuests];

  for (const waveIndex of availableWaveIndices) {
    const waveExists = existingQuests.some((q) => q.order === waveIndex);
    if (!waveExists) {
      newWaves.push(waveIndex);
      const newWave = await createQuestWave(today, waveIndex);
      allQuests = allQuests.concat(newWave);
    }
  }

  allQuests.sort((a, b) => a.order - b.order);

  const availableQuests = allQuests.filter((q) => availableWaveIndices.includes(q.order));
  const lockedQuests = allQuests.filter((q) => lockedWaveIndices.includes(q.order));

  return { quests: availableQuests, lockedQuests, newWaves };
}
