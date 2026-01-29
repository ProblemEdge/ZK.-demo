import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '../../../utils/notifications';
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

    await prisma.follow.create({
      data: {
        followerId: requesterId,
        followingId: decoded.userId
      }
    });

    await prisma.followRequest.update({
      where: { id: requestRecord.id },
      data: { status: 'APPROVED' }
    });

    await sendNotificationToUser(
      requesterId,
      'フォローリクエストが承認されました',
      'フォローが承認されました',
      `/user/${decoded.userId}`,
      decoded.userId,
      'FOLLOW_ACCEPTED'
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approve follow request error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: '承認に失敗しました' },
      { status: 500 }
    );
  }
}
