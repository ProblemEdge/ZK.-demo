import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find((row: string) => row.startsWith('auth-token='))
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

    const { targetUserId }: { targetUserId?: string } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserIdが必要です' },
        { status: 400 }
      );
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: decoded.userId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove follower error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'フォロー関係が見つかりません' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フォロワー削除に失敗しました' },
      { status: 500 }
    );
  }
}
