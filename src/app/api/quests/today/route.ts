import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '../../utils/notifications';

const prisma = new PrismaClient();

// クエストのテンプレート（3ウェーブ分・各1つ）
const QUEST_TEMPLATES = [
  // 朝7時
  [
    { title: '松本城と写真を撮る', description: '松本城が写っている写真を投稿しよう' },
  ],
  // 昼12時
  [
    { title: '松本の自然', description: '松本の美しい自然の写真を撮ろう' },
  ],
  // 午後17時
  [
    { title: '松本の季節', description: '今の季節の松本を切り取ろう' },
  ]
];

const RELEASE_HOURS = [7, 12, 17];

// 今日の0時を取得（日本時刻）
function getTodayMidnight(): Date {
  const now = new Date();
  // UTC時刻を日本標準時（JST: UTC+9）に変換
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  // 日本時刻の0時を取得
  const todayJst = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
  // UTCの0時に戻す
  return new Date(todayJst.getTime() - (9 * 60 * 60 * 1000));
}

// 現在時刻（日本時刻）を取得
function getCurrentJSTHour(): number {
  const now = new Date();
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return jstDate.getUTCHours();
}

// クエストを作成（存在しない場合のみ）
async function createQuestWave(today: Date, waveIndex: number): Promise<any[]> {
  const templates = QUEST_TEMPLATES[waveIndex];
  const quests: any[] = [];

  // 各テンプレートについて、既存チェック後に作成
  for (let index = 0; index < templates.length; index++) {
    const template = templates[index];
    const order = waveIndex * 1 + index; // シンプルにwaveIndexに基づく order

    // 既存チェック
    const existing = await prisma.dailyQuest.findUnique({
      where: {
        date_order: {
          date: today,
          order: order
        }
      }
    });

    if (!existing) {
      const newQuest = await prisma.dailyQuest.create({
        data: {
          title: template.title,
          description: template.description,
          date: today,
          order: order
        }
      });
      quests.push(newQuest);
    } else {
      quests.push(existing);
    }
  }

  return quests;
}

// 今日のクエストを取得（時間に応じて段階的にロック解除）
async function getTodayQuestsWithLocking(): Promise<{ quests: any[], lockedQuests: any[], newWaves: number[] }> {
  const today = getTodayMidnight();
  const currentHour = getCurrentJSTHour();
  
  // 利用可能なクエストを決定
  let availableWaveIndices: number[] = [];
  let lockedWaveIndices: number[] = [];
  
  if (currentHour < 7) {
    // 0時～7時未満：すべてロック
    lockedWaveIndices = [0, 1, 2];
  } else if (currentHour < 12) {
    // 7時～12時未満：第1ウェーブのみ
    availableWaveIndices = [0];
    lockedWaveIndices = [1, 2];
  } else if (currentHour < 17) {
    // 12時～17時未満：第1、第2ウェーブ
    availableWaveIndices = [0, 1];
    lockedWaveIndices = [2];
  } else {
    // 17時～24時：全ウェーブ
    availableWaveIndices = [0, 1, 2];
  }

  // 既存のクエストを取得
  const existingQuests = await prisma.dailyQuest.findMany({
    where: { date: today },
    orderBy: { order: 'asc' }
  });

  const newWaves: number[] = [];
  let allQuests = [...existingQuests];

  // 必要なウェーブが存在しなければ作成
  for (const waveIndex of availableWaveIndices) {
    // 各ウェーブが1つのクエストなので、order === waveIndex で判定
    const waveExists = existingQuests.some(q => q.order === waveIndex);
    
    if (!waveExists) {
      newWaves.push(waveIndex);
      const newWave = await createQuestWave(today, waveIndex);
      allQuests = allQuests.concat(newWave);
    }
  }

  // ソート
  allQuests.sort((a, b) => a.order - b.order);

  // 利用可能なクエストとロック中のクエストを分離
  const availableQuests = allQuests.filter((q) => {
    // order === waveIndex で判定
    return availableWaveIndices.includes(q.order);
  });

  const lockedQuests = allQuests.filter((q) => {
    // order === waveIndex で判定
    return lockedWaveIndices.includes(q.order);
  });

  return { quests: availableQuests, lockedQuests, newWaves };
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // 時間帯に応じてクエストを取得
    const { quests, lockedQuests, newWaves } = await getTodayQuestsWithLocking();

    // ユーザーの進行状況を取得（ロック中のクエストも含める）
    const allQuestIds = [...quests, ...lockedQuests].map(q => q.id);
    const progress = await prisma.userQuestProgress.findMany({
      where: {
        userId: decoded.userId,
        questId: { in: allQuestIds }
      }
    });

    // ユーザーの未承認クエスト投稿（進行中判定用）
    const pendingQuestPosts = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        isApproved: false,
        questId: { in: allQuestIds }
      },
      select: { questId: true }
    });
    const pendingQuestIds = new Set(pendingQuestPosts.map(p => p.questId));

    // 新しいウェーブがリリースされたかを判定
    const WAVE_MESSAGES = [
      { title: '🌅 朝のデイリークエスト登場！', body: '新しいクエストが利用可能になりました' },
      { title: '🌞 昼のデイリークエスト登場！', body: '新しいクエストが利用可能になりました' },
      { title: '🌆 夕方のデイリークエスト登場！', body: '新しいクエストが利用可能になりました' }
    ];

    // 新しいウェーブについて通知を送信（ユーザーがまだ進行状況を持たないウェーブのみ）
    for (const waveIndex of newWaves) {
      // そのウェーブのクエストIDを取得（order === waveIndex）
      const waveQuestIds = quests
        .filter(q => q.order === waveIndex)
        .map(q => q.id);
      
      // このウェーブについてユーザーが既に進行状況を持っているか確認
      const hasProgress = waveQuestIds.some(questId =>
        progress.some(p => p.questId === questId)
      );

      // 進行状況がなければ（つまり初回なら）通知を送信
      if (!hasProgress && waveQuestIds.length > 0) {
        const waveInfo = WAVE_MESSAGES[waveIndex];
        await sendNotificationToUser(
          decoded.userId,
          waveInfo.title,
          waveInfo.body,
          '/profile',
          undefined,
          'POST_CREATED'
        );
      }
    }

    // 利用可能なクエストの情報を構築
    const availableQuestsWithProgress = quests.map(quest => {
      const userProgress = progress.find(p => p.questId === quest.id);
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        order: quest.order,
        completed: userProgress?.completed || false,
        completedAt: userProgress?.completedAt || null,
        inProgress: pendingQuestIds.has(quest.id),
        locked: false
      };
    });

    // ロック中のクエストの情報を構築
    const lockedQuestsWithStatus = lockedQuests.map(quest => {
      const userProgress = progress.find(p => p.questId === quest.id);
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        order: quest.order,
        completed: userProgress?.completed || false,
        completedAt: userProgress?.completedAt || null,
        inProgress: pendingQuestIds.has(quest.id),
        locked: true
      };
    });

    const allQuestsData = [...availableQuestsWithProgress, ...lockedQuestsWithStatus];

    return NextResponse.json({
      quests: allQuestsData,
      date: getTodayMidnight(),
      currentHour: getCurrentJSTHour(),
      nextReleaseHour: RELEASE_HOURS.find(h => h > getCurrentJSTHour()) || 0
    });

  } catch (error) {
    console.error('Get today quests error:', error);
    return NextResponse.json(
      { error: 'クエストの取得に失敗しました' },
      { status: 500 }
    );
  }
}
