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

    const currentUserId = decoded.userId;

    // フレンドリクエストを承認
    await prisma.friendRequest.update({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: currentUserId
        }
      },
      data: {
        status: 'APPROVED'
      }
    });

    // 相互フレンド関係を作成
    await prisma.friend.create({
      data: {
        userId: currentUserId,
        friendId: requesterId
      }
    });

    await prisma.friend.create({
      data: {
        userId: requesterId,
        friendId: currentUserId
      }
    });

    // リクエストを削除
    await prisma.friendRequest.delete({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: currentUserId
        }
      }
    });

    await sendNotificationToUser(
      requesterId,
      '✅ フレンド申請が承認されました',
      'フレンドになりました！',
      `/user/${currentUserId}`,
      currentUserId,
      'FRIEND_ACCEPTED'
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approve friend request error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'リクエストが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'フレンド承認に失敗しました' },
      { status: 500 }
    );
  }
}