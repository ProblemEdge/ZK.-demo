import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: Request) {
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

    // URLパラメータから対象ユーザーIDを取得
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userIdが必要です' },
        { status: 400 }
      );
    }

    const [firstId, secondId] = [decoded.userId, targetUserId].sort();

    // フレンド関係を確認
    const friend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: firstId,
          friendId: secondId
        }
      }
    });

    const [outgoingRequest, incomingRequest] = await Promise.all([
      prisma.friendRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId: decoded.userId,
            targetId: targetUserId
          }
        }
      }),
      prisma.friendRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId: targetUserId,
            targetId: decoded.userId
          }
        }
      })
    ]);

    return NextResponse.json({
      isFriend: !!friend,
      isRequestedByMe: outgoingRequest?.status === 'PENDING',
      isRequestingMe: incomingRequest?.status === 'PENDING'
    });

  } catch (error) {
    console.error('Check friend error:', error);
    return NextResponse.json(
      { error: 'フレンド状態の確認に失敗しました' },
      { status: 500 }
    );
  }
}
