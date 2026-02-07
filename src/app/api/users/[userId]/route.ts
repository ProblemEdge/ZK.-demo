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

    const friendCount = user._count.friendsAsUser;

    // プロフィールに表示すべき投稿数を計算（投票期間中の投稿は投稿者本人以外には見せない）
    const now = new Date();
    let visiblePostsCount = 0;
    if (currentUserId === userId) {
      // オーナーは全投稿を見られる（既存の挙動を維持）
      visiblePostsCount = await prisma.post.count({ where: { userId } });
    } else {
      // 投票中の投稿を除外する条件:
      // - isApproved が true → 表示
      // - rejectedAt が not null → 表示期間次第（ここは count では表示対象外としない。既存の挙動に合わせるため表示扱いとする）
      // - 未承認かつ未却下 の場合、votingEndedAt が null (投票中) または 将来 の場合は非表示
      const votingClosedCondition = {
        OR: [
          { isApproved: true },
          { rejectedAt: { not: null } },
          {
            AND: [
              { isApproved: false },
              { rejectedAt: null },
              { votingEndedAt: { not: null, lte: now } }
            ]
          }
        ]
      };

      // visibilityScope: FRIENDS は viewer がフレンドでなければ除外
      const visibilityCondition: any = { userId };
      if (!isFriend) {
        visibilityCondition.visibilityScope = 'PUBLIC';
      }

      visiblePostsCount = await prisma.post.count({
        where: {
          AND: [visibilityCondition, votingClosedCondition]
        }
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        _Count: undefined,
        _count: {
          posts: visiblePostsCount,
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
