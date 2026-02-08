import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '../../utils/notifications';
import { prisma } from '@/lib/prisma';
import {
  getTodayMidnight,
  getCurrentJSTHour,
  getTodayQuestsWithLocking,
  RELEASE_HOURS,
} from '@/lib/quests';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find((row) => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // 時間帯に応じてクエストを取得
    const { quests, lockedQuests, newWaves } = await getTodayQuestsWithLocking();

    // ユーザーの進行状況を取得（ロック中のクエストも含める）
    const allQuestIds = [...quests, ...lockedQuests].map((q) => q.id);
    const progress = await prisma.userQuestProgress.findMany({
      where: {
        userId: decoded.userId,
        questId: { in: allQuestIds },
      },
    });

    // ユーザーの未承認クエスト投稿（進行中判定用）
    const pendingQuestPosts = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        isApproved: false,
        questId: { in: allQuestIds },
      },
      select: { questId: true },
    });
    const pendingQuestIds = new Set(pendingQuestPosts.map((p) => p.questId));

    // ユーザーの承認済みクエスト投稿（完了判定用）
    const approvedQuestPosts = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        isApproved: true,
        questId: { in: allQuestIds },
      },
      select: { questId: true },
    });
    const approvedQuestIds = new Set(approvedQuestPosts.map((p) => p.questId));

    // 新しいウェーブがリリースされたかを判定
    const WAVE_MESSAGES = [
      { title: '🌅 朝のデイリークエスト登場！', body: '新しいクエストが利用可能になりました' },
      { title: '🌞 昼のデイリークエスト登場！', body: '新しいクエストが利用可能になりました' },
      { title: '🌆 夕方のデイリークエスト登場！', body: '新しいクエストが利用可能になりました' },
    ];

    // 新しいウェーブについて通知を送信（ユーザーがまだ進行状況を持たないウェーブのみ）
    for (const waveIndex of newWaves) {
      // そのウェーブのクエストIDを取得（order === waveIndex）
      const waveQuestIds = quests.filter((q) => q.order === waveIndex).map((q) => q.id);

      // このウェーブについてユーザーが既に進行状況を持っているか確認
      const hasProgress = waveQuestIds.some((questId) =>
        progress.some((p) => p.questId === questId),
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
          'POST_CREATED',
        );
      }
    }

    // 利用可能なクエストの情報を構築
    const availableQuestsWithProgress = quests.map((quest) => {
      const userProgress = progress.find((p) => p.questId === quest.id);
      const hasPendingPost = pendingQuestIds.has(quest.id);
      const hasApprovedPost = approvedQuestIds.has(quest.id);

      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        order: quest.order,
        completed: userProgress?.completed || hasApprovedPost,
        completedAt: userProgress?.completedAt || null,
        inProgress: hasPendingPost && !hasApprovedPost && !userProgress?.completed,
        locked: false,
      };
    });

    // ロック中のクエストの情報を構築
    const lockedQuestsWithStatus = lockedQuests.map((quest) => {
      const userProgress = progress.find((p) => p.questId === quest.id);
      const hasPendingPost = pendingQuestIds.has(quest.id);
      const hasApprovedPost = approvedQuestIds.has(quest.id);

      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        order: quest.order,
        completed: userProgress?.completed || hasApprovedPost,
        completedAt: userProgress?.completedAt || null,
        inProgress: hasPendingPost && !hasApprovedPost,
        locked: true,
      };
    });

    const allQuestsData = [...availableQuestsWithProgress, ...lockedQuestsWithStatus];

    return NextResponse.json({
      quests: allQuestsData,
      date: getTodayMidnight(),
      currentHour: getCurrentJSTHour(),
      nextReleaseHour: RELEASE_HOURS.find((h) => h > getCurrentJSTHour()) || 0,
    });
  } catch (error) {
    console.error('Get today quests error:', error);
    return NextResponse.json({ error: 'クエストの取得に失敗しました' }, { status: 500 });
  }
}
