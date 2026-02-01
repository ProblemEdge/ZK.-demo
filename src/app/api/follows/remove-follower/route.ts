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

    const [firstId, secondId] = [decoded.userId, targetUserId].sort();

    await prisma.friend.delete({
      where: {
        userId_friendId: {
          userId: firstId,
          friendId: secondId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove friend error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'フレンド関係が見つかりません' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フレンド削除に失敗しました' },
      { status: 500 }
    );
  }
}
