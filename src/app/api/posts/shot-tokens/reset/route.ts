import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
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

    // 今日の投稿を削除（デバッグ用）
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 投稿に関連するデータを先に削除（外部キー制約対応）
    const postsToDelete = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        postedAt: { gte: startOfToday }
      },
      select: { id: true }
    });

    const postIds = postsToDelete.map(p => p.id);

    if (postIds.length > 0) {
      // コメント削除
      await prisma.comment.deleteMany({
        where: { postId: { in: postIds } }
      });

      // いいね削除
      await prisma.like.deleteMany({
        where: { postId: { in: postIds } }
      });

      // 投票削除
      await prisma.vote.deleteMany({
        where: { postId: { in: postIds } }
      });

      // 報告削除
      await prisma.report.deleteMany({
        where: { postId: { in: postIds } }
      });

      // 投稿削除
      await prisma.post.deleteMany({
        where: {
          userId: decoded.userId,
          postedAt: { gte: startOfToday }
        }
      });
    }

    return NextResponse.json({
      message: '投稿上限をリセットしました（デバッグ用）'
    });

  } catch (error) {
    console.error('Reset shot tokens error:', error);
    return NextResponse.json(
      { error: 'リセットに失敗しました' },
      { status: 500 }
    );
  }
}
