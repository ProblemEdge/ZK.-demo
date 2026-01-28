import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '../../../utils/notifications';

const prisma = new PrismaClient();

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const { requesterId } = await request.json();

    if (!requesterId) {
      return NextResponse.json(
        { error: 'requesterIdが必要です' },
        { status: 400 }
      );
    }

    const requestRecord = await prisma.followRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: decoded.userId
        }
      }
    });

    if (!requestRecord || requestRecord.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'リクエストが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.followRequest.update({
      where: { id: requestRecord.id },
      data: { status: 'REJECTED' }
    });

    await sendNotificationToUser(
      requesterId,
      'フォローリクエストが拒否されました',
      'フォローが拒否されました',
      `/user/${decoded.userId}`,
      decoded.userId,
      'FOLLOW_REJECTED'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject follow request error:', error);
    return NextResponse.json(
      { error: '拒否に失敗しました' },
      { status: 500 }
    );
  }
}
