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

    // 自分の投稿を取得（承認済み + 却下済み）
    const posts = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        OR: [
          { isApproved: true },
          { rejectedAt: { not: null } }
        ]
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        tags: true,
        postedAt: true,
        rejectedAt: true,
        isApproved: true,
        questId: true,
        visibilityScope: true,
        visibilityDurationMinutes: true,
        quest: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true
          }
        }
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 50 // 最新50件
    });

    const now = Date.now();
    const filteredPosts = posts.filter((post) => {
      // 却下済み投稿は表示期間内のみ表示
      if (post.rejectedAt) {
        const duration: number | null = (post as any).visibilityDurationMinutes;
        if (duration == null) return false; // 期間なしなら非表示
        const withinDuration = new Date(post.postedAt).getTime() >= (now - duration * 60 * 1000);
        return withinDuration;
      }

      // 承認済み投稿は表示期間内のみ表示
      if (post.isApproved) {
        const duration: number | null = (post as any).visibilityDurationMinutes;
        if (duration == null) return true; // 期間なしなら無制限表示
        const withinDuration = new Date(post.postedAt).getTime() >= (now - duration * 60 * 1000);
        return withinDuration;
      }

      return false;
    });

    return NextResponse.json(filteredPosts);

    return NextResponse.json(filteredPosts);

  } catch (error) {
    console.error('Get my posts error:', error);
    return NextResponse.json(
      { error: '認証エラー' },
      { status: 401 }
    );
  }
}