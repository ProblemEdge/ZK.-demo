import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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

    // フレンドリクエストを削除（拒否）
    await prisma.friendRequest.delete({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: currentUserId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'リクエストが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'フレンド拒否に失敗しました' },
      { status: 500 }
    );
  }
}