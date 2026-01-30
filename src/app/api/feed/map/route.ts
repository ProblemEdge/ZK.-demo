import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

    const followingList = await prisma.follow.findMany({
      where: { followerId: decoded.userId },
      select: { followingId: true }
    });
    const followingIds = followingList.map(f => f.followingId);
    const allowedIds = [decoded.userId, ...followingIds];

    const posts = await prisma.post.findMany({
      where: {
        isApproved: true,
        latitude: { not: null },
        longitude: { not: null },
        OR: [
          { visibilityScope: 'PUBLIC' },
          {
            AND: [
              { visibilityScope: 'FOLLOWERS' },
              { userId: { in: allowedIds } }
            ]
          }
        ]
      },
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        caption: true,
        tags: true,
        postedAt: true,
        questId: true,
        latitude: true,
        longitude: true,
        locationName: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      },
      orderBy: { postedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get map feed error:', error);
    return NextResponse.json(
      { error: 'マップ用投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}
