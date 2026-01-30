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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // 通知数のみ（フォローリクエストは別APIで取得）
    const unreadCount = await prisma.notification.count({
      where: { userId: decoded.userId, isRead: false }
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error('Unread notifications count error:', error);
    return NextResponse.json(
      { error: '通知数の取得に失敗しました' },
      { status: 500 }
    );
  }
}
