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

    // 友達リストを取得
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [{ userId: currentUserId }, { friendId: currentUserId }]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true,
            _count: {
              select: {
                posts: true,
                friendsAsUser: true,
                friendsAsFriend: true
              }
            }
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            level: true,
            gems: true,
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

    // 自分以外のユーザーを友達として抽出
    const friends = friendships.map((friendship: any) => {
      const friend =
        friendship.userId === currentUserId ? friendship.friend : friendship.user;
      const friendCount = friend._count.friendsAsUser;
      return {
        ...friend,
        _count: {
          posts: friend._count.posts,
          friends: friendCount
        }
      };
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error('友達リスト取得エラー:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
