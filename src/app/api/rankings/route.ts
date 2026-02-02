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
    const mode = url.searchParams.get('mode') || 'world'; // 'world' or 'friends'
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    const skip = (page - 1) * limit;

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

    // フレンドユーザーリストを取得（身内ランキング用）
    let userFilter: any = {};
    if (mode === 'friends' && currentUserId) {
      const friendsList = await prisma.friend.findMany({
        where: { OR: [{ userId: currentUserId }, { friendId: currentUserId }] },
        select: { userId: true, friendId: true }
      });
      const friendIds = friendsList.map(f => (f.userId === currentUserId ? f.friendId : f.userId));
      userFilter = { id: { in: [...friendIds, currentUserId] } };
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
          take: limit,
          skip: skip
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
          take: limit,
          skip: skip
        });
        break;

      case 'votes':
        // もらった投票数ランキング（投稿への投票数）
        const usersWithVotes = await prisma.user.findMany({
          where: userFilter,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true,
            posts: {
              where: dateFilter ? { postedAt: dateFilter } : {},
              select: {
                id: true,
                _count: {
                  select: { votes: true }
                }
              }
            }
          }
        });

        ranking = usersWithVotes
          .map(user => {
            const totalVotes = user.posts.reduce(
              (sum: number, post: any) => sum + post._count.votes,
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
          .sort((a, b) => b.totalVotes - a.totalVotes)
          .slice(skip, skip + limit);
        break;

      case 'voted':
        // 投票した回数ランキング
        const usersWithVotedCount = await prisma.user.findMany({
          where: userFilter,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true,
            votes: {
              where: dateFilter ? { createdAt: dateFilter } : {},
              select: { id: true }
            }
          }
        });

        ranking = usersWithVotedCount
          .map(user => {
            const votedCount = user.votes.length;
            return {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              level: user.level,
              gems: user.gems,
              votedCount
            };
          })
          .sort((a, b) => b.votedCount - a.votedCount)
          .slice(skip, skip + limit);
        break;

      case 'likes':
        // 獲得いいねランキング
        const usersWithLikes = await prisma.user.findMany({
          where: userFilter,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true,
            posts: {
              where: dateFilter ? { postedAt: dateFilter } : {},
              select: {
                id: true,
                _count: {
                  select: { likes: true }
                }
              }
            }
          }
        });
        
        ranking = usersWithLikes
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
          .sort((a, b) => b.totalLikes - a.totalLikes)
          .slice(skip, skip + limit);
        break;
    }

    // userFilter を適用（身内モードの場合）
    if (mode === 'following' && currentUserId && !['votes', 'voted', 'likes'].includes(rankingType)) {
      const friendsList = await prisma.friend.findMany({
        where: {
          OR: [
            { userId: currentUserId },
            { friendId: currentUserId }
          ]
        },
        select: { userId: true, friendId: true }
      });
      const friendIds = new Set([
        ...friendsList.map(f => f.userId === currentUserId ? f.friendId : f.userId),
        currentUserId
      ]);
      ranking = ranking.filter(user => friendIds.has(user.id));
    }

    return NextResponse.json({
      ranking,
      type: rankingType,
      period,
      mode,
      page,
      limit
    });
  } catch (error) {
    console.error('Ranking error:', error);
    return NextResponse.json(
      { error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    );
  }
}
