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
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // 送信済みのリクエストが存在するか確認
    // 現在のユーザーが requesterId、対象ユーザーが targetId
    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId: currentUserId,
          targetId: targetUserId
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // リクエストをキャンセル（削除）
    await prisma.friendRequest.delete({
      where: {
        requesterId_targetId: {
          requesterId: currentUserId,
          targetId: targetUserId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('申請キャンセルエラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
