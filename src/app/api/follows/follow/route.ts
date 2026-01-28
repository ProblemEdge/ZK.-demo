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

    // 既にフォロー済みか確認
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      return NextResponse.json({
        success: true,
        isFollowing: true,
        isRequested: false
      });
    }

    // フォローリクエストを作成（リクエスト制）
    const followRequest = await prisma.followRequest.upsert({
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
      'フォローリクエストが届きました',
      'フォローを承認するか選択してください',
      '/profile',
      decoded.userId,
      'FOLLOW_REQUEST'
    );
    
    console.log('[Follow] Follow request notification sent successfully');

    return NextResponse.json({
      success: true,
      isFollowing: false,
      isRequested: followRequest.status === 'PENDING'
    });

  } catch (error: any) {
    console.error('Follow error:', error);
    
    // 既にリクエスト済みの場合
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '既にリクエスト済みです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フォローに失敗しました' },
      { status: 500 }
    );
  }
}
