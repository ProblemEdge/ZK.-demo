import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    const [unreadCount, pendingRequests] = await Promise.all([
      prisma.notification.count({
        where: { userId: decoded.userId, isRead: false }
      }),
      prisma.followRequest.count({
        where: { targetId: decoded.userId, status: 'PENDING' }
      })
    ]);

    return NextResponse.json({ count: unreadCount + pendingRequests });
  } catch (error) {
    console.error('Unread notifications count error:', error);
    return NextResponse.json(
      { error: '通知数の取得に失敗しました' },
      { status: 500 }
    );
  }
}
