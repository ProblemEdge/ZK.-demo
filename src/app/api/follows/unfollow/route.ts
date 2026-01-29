import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

    // フォロー関係を削除
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: targetUserId
        }
      }
    });

    return NextResponse.json({
      success: true,
      isFollowing: false
    });

  } catch (error: any) {
    console.error('Unfollow error:', error);
    
    // フォロー関係が見つからない場合
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'フォロー関係が見つかりません' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フォロー解除に失敗しました' },
      { status: 500 }
    );
  }
}
