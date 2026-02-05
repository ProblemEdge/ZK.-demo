import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // オプションで閲覧者の認証トークンを取得（FRIENDS公開の判定に使用）
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    let viewerId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        viewerId = decoded.userId;
      } catch (e) {
        // トークン無効でも続行（未認証として扱う）
        viewerId = null;
      }
    }

    // ユーザーの承認済み投稿を取得（表示条件はサーバー側でフィルタリング）
    const posts = await prisma.post.findMany({
      where: {
        userId,
        isApproved: true
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        postedAt: true,
        visibilityScope: true,
        visibilityDurationMinutes: true
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 50
    });

    // 閲覧者が対象ユーザーのフレンドかどうかを判定（FRIENDS公開の取扱い用）
    let isViewerFriend = false;
    if (viewerId && viewerId !== userId) {
      const rel = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId: userId, friendId: viewerId },
            { userId: viewerId, friendId: userId }
          ]
        }
      });
      isViewerFriend = !!rel;
    }

    const now = Date.now();
    const filtered = posts.filter(post => {
      const duration: number | null = (post as any).visibilityDurationMinutes;
      // 期間指定なし => 常に表示（owner/公開の意味合いに合わせる）
      const withinDuration = duration == null || (new Date(post.postedAt).getTime() >= (now - duration * 60 * 1000));
      if (!withinDuration) return false;

      // FRIENDS公開は閲覧者がフレンドか本人のみ表示
      if ((post as any).visibilityScope === 'FRIENDS') {
        if (viewerId === userId) return true; // 自分のプロフィールなら見せる
        return isViewerFriend;
      }

      // PUBLICは表示
      return true;
    });

    return NextResponse.json(filtered);

  } catch (error) {
    console.error('Get user posts error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}
