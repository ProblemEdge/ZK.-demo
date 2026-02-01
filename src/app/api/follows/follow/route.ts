import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '../../utils/notifications';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Cookieからトークン取得
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

    // トークン検証
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

    if (decoded.userId === targetUserId) {
      return NextResponse.json(
        { error: '自分自身をフォローできません' },
        { status: 400 }
      );
    }

    const [firstId, secondId] = [decoded.userId, targetUserId].sort();

    // 既にフレンドか確認
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: firstId,
          friendId: secondId
        }
      }
    });

    if (existingFriend) {
      return NextResponse.json({
        success: true,
        isFriend: true,
        isRequested: false
      });
    }

    // 相手からのリクエストがある場合は承認
    const incomingRequest = await prisma.friendRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: targetUserId,
          targetId: decoded.userId
        }
      }
    });

    if (incomingRequest?.status === 'PENDING') {
      await prisma.friend.create({
        data: {
          userId: firstId,
          friendId: secondId
        }
      });

      await prisma.friendRequest.update({
        where: { id: incomingRequest.id },
        data: { status: 'APPROVED' }
      });

      await sendNotificationToUser(
        targetUserId,
        'フレンド申請が承認されました',
        'フレンドになりました',
        `/user/${decoded.userId}`,
        decoded.userId,
        'FRIEND_ACCEPTED'
      );

      return NextResponse.json({
        success: true,
        isFriend: true,
        isRequested: false
      });
    }

    // フレンドリクエストを作成
    const friendRequest = await prisma.friendRequest.upsert({
      where: {
        requesterId_targetId: {
          requesterId: decoded.userId,
          targetId: targetUserId
        }
      },
      create: {
        requesterId: decoded.userId,
        targetId: targetUserId,
        status: 'PENDING'
      },
      update: {
        status: 'PENDING'
      }
    });

    console.log('[Follow] Sending follow request notification to:', targetUserId);
    
    await sendNotificationToUser(
      targetUserId,
      'フレンドリクエストが届きました',
      'フレンド申請を承認するか選択してください',
      '/profile',
      decoded.userId,
      'FRIEND_REQUEST'
    );
    
    console.log('[Follow] Follow request notification sent successfully');

    return NextResponse.json({
      success: true,
      isFriend: false,
      isRequested: friendRequest.status === 'PENDING'
    });

  } catch (error: any) {
    console.error('Friend request error:', error);
    
    // 既にリクエスト済みの場合
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '既にリクエスト済みです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フレンド申請に失敗しました' },
      { status: 500 }
    );
  }
}
