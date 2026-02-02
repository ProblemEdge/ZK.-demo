import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface JwtPayload {
  userId: string;
}

export async function GET(req: NextRequest) {
  try {
    // 認証トークン取得
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const currentUserId = decoded.userId;

    // 自分宛ての申請（承認待ち）
    const receivedRequests = await prisma.friendRequest.findMany({
      where: {
        targetId: currentUserId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true,
            bio: true,
            _count: {
              select: {
                posts: true,
                friendsAsUser: true,
                friendsAsFriend: true
              }
            }
          }
        }
      }
    });

    const formattedRequests = receivedRequests.map((request: any) => {
      const friendCount = request.requester._count.friendsAsUser;
      return {
        ...request.requester,
        _count: {
          posts: request.requester._count.posts,
          friends: friendCount
        }
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('受信申請リスト取得エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
