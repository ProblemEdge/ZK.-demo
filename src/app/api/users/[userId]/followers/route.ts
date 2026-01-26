import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    // フォロワー一覧を取得（このユーザーをフォローしている人）
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
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
          }
        }
      }
    });

    // フォロー状態を確認
    let followingSet: Set<string> = new Set();
    if (currentUserId) {
      const following = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      followingSet = new Set(following.map(f => f.followingId));
    }

    const result = followers.map(f => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.displayName,
      avatarUrl: f.follower.avatarUrl,
      bio: f.follower.bio,
      _count: f.follower._count,
      isFollowing: followingSet.has(f.follower.id)
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { error: 'フォロワー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
