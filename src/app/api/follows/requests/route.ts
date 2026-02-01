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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'incoming';

    if (type === 'outgoing') {
      const requests = await prisma.friendRequest.findMany({
        where: { requesterId: decoded.userId, status: 'PENDING' },
        include: {
          target: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(requests);
    }

    const requests = await prisma.friendRequest.findMany({
      where: { targetId: decoded.userId, status: 'PENDING' },
      include: {
        requester: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    return NextResponse.json(
      { error: 'フレンドリクエストの取得に失敗しました' },
      { status: 500 }
    );
  }
}
