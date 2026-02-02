import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface JwtPayload {
  userId: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const currentUserId = decoded.userId;
    const { requesterId } = await req.json();

    if (!requesterId) {
      return NextResponse.json({ error: 'requesterId is required' }, { status: 400 });
    }

    // トランザクション内ですべての操作を実行
    await prisma.$transaction([
      // 相互フレンド関係を作成
      prisma.friend.create({
        data: {
          userId: currentUserId,
          friendId: requesterId
        }
      }),
      prisma.friend.create({
        data: {
          userId: requesterId,
          friendId: currentUserId
        }
      }),
      // 受け取ったリクエストを削除
      prisma.friendRequest.delete({
        where: {
          requesterId_targetId: {
            requesterId,
            targetId: currentUserId
          }
        }
      }),
      // 送ったリクエストがあれば削除（相互リクエストの場合）
      prisma.friendRequest.deleteMany({
        where: {
          requesterId: currentUserId,
          targetId: requesterId,
          status: 'PENDING'
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('友達承認エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
