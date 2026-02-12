import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

    const friendsList = await prisma.friend.findMany({
      where: {
        OR: [{ userId: decoded.userId }, { friendId: decoded.userId }],
      },
      select: { userId: true, friendId: true },
    });
    const friendIds = friendsList.map((f) => (f.userId === decoded.userId ? f.friendId : f.userId));
    const allowedIds = [decoded.userId, ...friendIds];

    // feed と同様の承認済み判定を使いつつ、自分の投稿は未承認でも表示する
    const approvedWhereClause: any = {
      isApproved: true,
      OR: [
        { visibilityScope: 'PUBLIC' },
        { AND: [{ visibilityScope: 'FRIENDS' }, { userId: { in: allowedIds } }] },
      ],
    };

    // 承認済みの公開投稿（位置情報あり）を取得
    const approvedPosts = await prisma.post.findMany({
      where: {
        AND: [approvedWhereClause, { latitude: { not: null } }, { longitude: { not: null } }],
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
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true } },
      },
      orderBy: { postedAt: 'desc' },
      take: 50,
    });

    // 自分自身の位置情報付き投稿（未承認含む）
    const ownPosts = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        latitude: { not: null },
        longitude: { not: null },
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
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true } },
      },
    });

    // 結合して重複排除
    const combined = [...approvedPosts, ...ownPosts];
    const byId = new Map<string, (typeof combined)[number]>();
    for (const p of combined) {
      if (!byId.has(p.id)) byId.set(p.id, p);
    }

    // 公開期間 (visibilityDurationMinutes) のチェック（期限切れは除外）
    const postsArr = Array.from(byId.values()).filter((p: any) => {
      const duration = (p as any).visibilityDurationMinutes;
      const withinDuration =
        duration == null || new Date(p.postedAt).getTime() >= Date.now() - duration * 60 * 1000;
      return withinDuration;
    });

    return NextResponse.json({ posts: postsArr });
  } catch (error) {
    console.error('Get map feed error:', error);
    return NextResponse.json({ error: 'マップ用投稿の取得に失敗しました' }, { status: 500 });
  }
}
