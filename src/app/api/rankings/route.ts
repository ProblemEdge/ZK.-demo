import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

function getDateFilter(period: Period) {
  const now = new Date();
  let startDate: Date | null = null;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
      startDate = null;
      break;
  }

  return startDate ? { gte: startDate } : undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rankingType = url.searchParams.get('type') || 'level';
    const period = (url.searchParams.get('period') || 'all') as Period;
    const mode = url.searchParams.get('mode') || 'world'; // 'world' or 'following'

    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    let currentUserId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        currentUserId = decoded.userId;
      } catch {
        // トークン検証失敗時
      }
    }

    // フォロー中ユーザーリストを取得（身内ランキング用）
    let userFilter: any = {};
    if (mode === 'following' && currentUserId) {
      const followingList = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      const followingIds = followingList.map(f => f.followingId);
      userFilter = { id: { in: [...followingIds, currentUserId] } };
    }

    const dateFilter = getDateFilter(period);

    let ranking: any[] = [];

    switch (rankingType) {
      case 'level':
        // レベルランキング
        ranking = await prisma.user.findMany({
          where: userFilter,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true
          },
          orderBy: [{ level: 'desc' }, { experience: 'desc' }],
          take: 100
        });
        break;

      case 'gems':
        // 所持ジェムランキング
        ranking = await prisma.user.findMany({
          where: userFilter,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true
          },
          orderBy: { gems: 'desc' },
          take: 100
        });
        break;

      case 'votes':
        // もらえた投票数ランキング
        ranking = await prisma.user.findMany({
          where: userFilter,
          include: {
            posts: {
              where: dateFilter ? { postedAt: dateFilter } : {},
              select: {
                id: true,
                votes: true
              }
            }
          },
          take: 100
        });

        ranking = ranking
          .map(user => {
            const totalVotes = user.posts.reduce(
              (sum: number, post: any) => sum + post.votes.length,
              0
            );
            return {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              level: user.level,
              gems: user.gems,
              totalVotes
            };
          })
          .sort((a, b) => b.totalVotes - a.totalVotes);
        break;

      case 'likes':
        // 獲得いいねランキング
        ranking = await prisma.user.findMany({
          where: userFilter,
          include: {
            posts: {
              where: dateFilter ? { postedAt: dateFilter } : {},
              select: {
                id: true,
                _count: {
                  select: { likes: true }
                }
              }
            }
          },
          take: 100
        });

        ranking = ranking
          .map(user => {
            const totalLikes = user.posts.reduce(
              (sum: number, post: any) => sum + post._count.likes,
              0
            );
            return {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              level: user.level,
              gems: user.gems,
              totalLikes
            };
          })
          .sort((a, b) => b.totalLikes - a.totalLikes);
        break;

      case 'quest-speed':
        // デイリークエスト処理速度ランキング（完了時間の平均）
        const questProgress = await prisma.userQuestProgress.findMany({
          where: {
            completed: true,
            ...(dateFilter ? { completedAt: dateFilter } : {})
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                level: true,
                gems: true
              }
            },
            quest: {
              select: {
                date: true
              }
            }
          }
        });

        const questSpeedMap = new Map<string, any>();
        questProgress.forEach(progress => {
          if (!questSpeedMap.has(progress.userId)) {
            questSpeedMap.set(progress.userId, {
              id: progress.user.id,
              username: progress.user.username,
              displayName: progress.user.displayName,
              avatarUrl: progress.user.avatarUrl,
              level: progress.user.level,
              gems: progress.user.gems,
              completedCount: 0,
              avgCompletionTime: 0
            });
          }

          const userStat = questSpeedMap.get(progress.userId);
          userStat.completedCount++;

          if (progress.quest && progress.completedAt) {
            const questDate = new Date(progress.quest.date);
            const completedDate = new Date(progress.completedAt);
            const timeMs =
              completedDate.getTime() - questDate.getTime();
            userStat.avgCompletionTime =
              (userStat.avgCompletionTime *
                (userStat.completedCount - 1) +
                timeMs) /
              userStat.completedCount;
          }
        });

        ranking = Array.from(questSpeedMap.values())
          .filter(r => r.completedCount > 0)
          .sort((a, b) => a.avgCompletionTime - b.avgCompletionTime)
          .slice(0, 100);
        break;
    }

    // userFilter を適用
    if (mode === 'following' && currentUserId && rankingType !== 'quest-speed') {
      const followingList = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      const followingIds = new Set([...followingList.map(f => f.followingId), currentUserId]);
      ranking = ranking.filter(user => followingIds.has(user.id));
    }

    return NextResponse.json({
      ranking,
      type: rankingType,
      period,
      mode
    });
  } catch (error) {
    console.error('Ranking error:', error);
    return NextResponse.json(
      { error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    );
  }
}
