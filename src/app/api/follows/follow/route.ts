import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Cookieからトークン取得
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

    // トークン検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const { targetUserId } = await request.json();

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

    // フォロー関係を作成
    const follow = await prisma.follow.create({
      data: {
        followerId: decoded.userId,
        followingId: targetUserId
      }
    });

    return NextResponse.json({
      success: true,
      isFollowing: true
    });

  } catch (error: any) {
    console.error('Follow error:', error);
    
    // 既にフォロー済みの場合
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '既にフォロー中です' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フォローに失敗しました' },
      { status: 500 }
    );
  }
}
