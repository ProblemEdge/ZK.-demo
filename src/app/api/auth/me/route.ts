import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Cookieからトークン取得
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // トークン検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    // ユーザー情報取得（投稿数も含む）
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
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

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      followerCount: user._count.following,
      followingCount: user._count.followers,
      level: user.level,
      gems: user.gems,
      experience: user.experience
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '認証エラー' },
      { status: 401 }
    );
  }
}