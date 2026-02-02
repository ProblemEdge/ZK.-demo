import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { sendNotificationToUser } from '../../utils/notifications';

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

    // 既にフレンドか確認
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: decoded.userId,
          friendId: targetUserId
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

    // 逆方向も確認
    const existingFriendReverse = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: targetUserId,
          friendId: decoded.userId
        }
      }
    });

    if (existingFriendReverse) {
      return NextResponse.json({
        success: true,
        isFriend: true,
        isRequested: false
      });
    }

    // 既にリクエストがあるか確認
    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: decoded.userId,
          targetId: targetUserId
        }
      }
    });

    if (existingRequest?.status === 'PENDING') {
      return NextResponse.json({
        success: true,
        isFriend: false,
        isRequested: true
      });
    }

    // 新しいフレンドリクエストを作成
    const friendRequest = await prisma.friendRequest.create({
      data: {
        requesterId: decoded.userId,
        targetId: targetUserId,
        status: 'PENDING'
      }
    });

    console.log('[Follow] Sending friend request notification to:', targetUserId);
    
    await sendNotificationToUser(
      targetUserId,
      '🤝 フレンド申請が届きました',
      '承認するには友達ページをチェック！',
      '/discover?friendFilter=request',
      decoded.userId,
      'FRIEND_REQUEST'
    );
    
    console.log('[Follow] Friend request notification sent successfully');

    return NextResponse.json({
      success: true,
      isFriend: false,
      isRequested: true
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
