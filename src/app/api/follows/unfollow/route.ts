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

    const currentUserId = decoded.userId;

    // フレンド関係を削除（両方向）
    await Promise.all([
      prisma.friend.delete({
        where: {
          userId_friendId: {
            userId: currentUserId,
            friendId: targetUserId
          }
        }
      }).catch(() => {}), // 片方向が存在しない場合もある
      prisma.friend.delete({
        where: {
          userId_friendId: {
            userId: targetUserId,
            friendId: currentUserId
          }
        }
      }).catch(() => {})
    ]);

    return NextResponse.json({
      success: true,
      isFriend: false
    });

  } catch (error: any) {
    console.error('Remove friend error:', error);
    
    // フレンド関係が見つからない場合
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'フレンド関係が見つかりません' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'フレンド解除に失敗しました' },
      { status: 500 }
    );
  }
}