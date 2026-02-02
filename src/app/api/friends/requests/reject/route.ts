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

    // リクエストが存在するか確認
    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: currentUserId
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // リクエストを拒否（削除）
    await prisma.friendRequest.delete({
      where: {
        requesterId_targetId: {
          requesterId,
          targetId: currentUserId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('友達拒否エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
