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

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        level: true,
        gems: true,
        experience: true,
        _count: {
          select: {
            posts: { where: { isApproved: true } },
            friendsAsUser: true,
            friendsAsFriend: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // フレンド状態を確認
    let isFriend = false;
    let isRequestedByMe = false;
    let isRequestingMe = false;
    if (currentUserId && currentUserId !== userId) {
      const [firstId, secondId] = [currentUserId, userId].sort();
      const [friend, outgoingRequest, incomingRequest] = await Promise.all([
        prisma.friend.findUnique({
          where: {
            userId_friendId: {
              userId: firstId,
              friendId: secondId
            }
          }
        }),
        prisma.friendRequest.findUnique({
          where: {
            requesterId_targetId: {
              requesterId: currentUserId,
              targetId: userId
            }
          }
        }),
        prisma.friendRequest.findUnique({
          where: {
            requesterId_targetId: {
              requesterId: userId,
              targetId: currentUserId
            }
          }
        })
      ]);
      isFriend = !!friend;
      isRequestedByMe = outgoingRequest?.status === 'PENDING';
      isRequestingMe = incomingRequest?.status === 'PENDING';
    }

    const friendCount = user._count.friendsAsUser + user._count.friendsAsFriend;

    return NextResponse.json({
      user: {
        ...user,
        _count: {
          posts: user._count.posts,
          friends: friendCount
        }
      },
      isFriend,
      isRequestedByMe,
      isRequestingMe
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
