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

    // フォロー中のユーザー一覧を取得（このユーザーがフォローしている人）
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
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
      const currentUserFollowing = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      followingSet = new Set(currentUserFollowing.map(f => f.followingId));
    }

    const result = following.map(f => ({
      id: f.following.id,
      username: f.following.username,
      displayName: f.following.displayName,
      avatarUrl: f.following.avatarUrl,
      bio: f.following.bio,
      _count: f.following._count,
      isFollowing: followingSet.has(f.following.id)
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get following error:', error);
    return NextResponse.json(
      { error: 'フォロー中のユーザー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
