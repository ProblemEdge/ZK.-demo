import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // 現在のユーザーIDを取得（オプション）
    const cookieHeader = req.headers.get('cookie');
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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ユーザーを検索（ユーザー名と表示名で）
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query } },
              { displayName: { contains: query } }
            ]
          },
          // 自分を除外
          currentUserId ? { id: { not: currentUserId } } : {}
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        level: true,
        gems: true,
        // bioは検索結果一覧では不要なので削除
        _count: {
          select: {
            posts: true,
            friendsAsUser: true,
            friendsAsFriend: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    // 現在のユーザーのフレンド情報を取得
    let friendUserIds: Set<string> = new Set();
    let requestedUserIds: Set<string> = new Set();
    if (currentUserId) {
      const [friends, outgoingRequests] = await Promise.all([
        prisma.friend.findMany({
          where: { OR: [{ userId: currentUserId }, { friendId: currentUserId }] },
          select: { userId: true, friendId: true }
        }),
        prisma.friendRequest.findMany({
          where: { requesterId: currentUserId, status: 'PENDING' },
          select: { targetId: true }
        })
      ]);
      friendUserIds = new Set(
        friends.map(f => (f.userId === currentUserId ? f.friendId : f.userId))
      );
      requestedUserIds = new Set(outgoingRequests.map(r => r.targetId));
    }

    // フレンド情報を追加
    const usersWithFriendStatus = users.map(user => {
      const friendCount = user._count.friendsAsUser + user._count.friendsAsFriend;
      return {
        ...user,
        _count: { posts: user._count.posts, friends: friendCount },
        isFriend: friendUserIds.has(user.id),
        isRequested: requestedUserIds.has(user.id)
      };
    });

    return Response.json(usersWithFriendStatus);
  } catch (error) {
    console.error('User search error:', error);
    return Response.json({ error: 'ユーザー検索に失敗しました' }, { status: 500 });
  }
}
