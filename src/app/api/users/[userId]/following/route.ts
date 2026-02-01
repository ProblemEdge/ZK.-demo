import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // 現在のユーザーIDを取得（オプション）
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    let currentUserId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        currentUserId = decoded.userId;
      } catch {
        // トークン検証失敗時はそのまま続行
      }
    }

    // フレンド一覧を取得
    const friends = await prisma.friend.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            _count: {
              select: {
                posts: { where: { isApproved: true } },
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
            bio: true,
            _count: {
              select: {
                posts: { where: { isApproved: true } },
                friendsAsUser: true,
                friendsAsFriend: true
              }
            }
          }
        }
      }
    });

    let friendSet: Set<string> = new Set();
    if (currentUserId) {
      const currentFriends = await prisma.friend.findMany({
        where: { OR: [{ userId: currentUserId }, { friendId: currentUserId }] },
        select: { userId: true, friendId: true }
      });
      friendSet = new Set(
        currentFriends.map(f => (f.userId === currentUserId ? f.friendId : f.userId))
      );
    }

    const result = friends.map(f => {
      const friendUser = f.userId === userId ? f.friend : f.user;
      const friendCount = friendUser._count.friendsAsUser + friendUser._count.friendsAsFriend;
      return {
        id: friendUser.id,
        username: friendUser.username,
        displayName: friendUser.displayName,
        avatarUrl: friendUser.avatarUrl,
        bio: friendUser.bio,
        _count: {
          posts: friendUser._count.posts,
          friends: friendCount
        },
        isFriend: currentUserId ? friendSet.has(friendUser.id) : false
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json(
      { error: 'フレンド一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
