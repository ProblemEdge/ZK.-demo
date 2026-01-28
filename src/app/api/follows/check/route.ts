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

    // フォロー関係を確認
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: targetUserId
        }
      }
    });

    const [outgoingRequest, incomingRequest] = await Promise.all([
      prisma.followRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId: decoded.userId,
            targetId: targetUserId
          }
        }
      }),
      prisma.followRequest.findUnique({
        where: {
          requesterId_targetId: {
            requesterId: targetUserId,
            targetId: decoded.userId
          }
        }
      })
    ]);

    return NextResponse.json({
      isFollowing: !!follow,
      isRequestedByMe: outgoingRequest?.status === 'PENDING',
      isRequestingMe: incomingRequest?.status === 'PENDING'
    });

  } catch (error) {
    console.error('Check follow error:', error);
    return NextResponse.json(
      { error: 'フォロー状態の確認に失敗しました' },
      { status: 500 }
    );
  }
}
