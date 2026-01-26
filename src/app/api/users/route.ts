import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } }
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        _count: {
          select: {
            posts: { where: { isApproved: true } },
            followers: true,
            following: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    // 現在のユーザーのフォロー情報を取得
    let followingUserIds: Set<string> = new Set();
    if (currentUserId) {
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      followingUserIds = new Set(following.map(f => f.followingId));
    }

    // フォロー情報を追加
    const usersWithFollowStatus = users.map(user => ({
      ...user,
      isFollowing: followingUserIds.has(user.id)
    }));

    return Response.json(usersWithFollowStatus);
  } catch (error) {
    console.error('User search error:', error);
    return Response.json({ error: 'ユーザー検索に失敗しました' }, { status: 500 });
  }
}
