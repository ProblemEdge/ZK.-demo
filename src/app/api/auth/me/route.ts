import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Cookieからトークン取得
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // トークン検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        level: true,
        gems: true,
        experience: true,
        currentStreak: true,
        maxStreak: true,
        completedQuestsCount: true,
        _count: {
          select: {
            posts: { where: { isApproved: true } },
            friendsAsUser: true,
            friendsAsFriend: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const friendCount = user._count.friendsAsUser;

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      level: user.level,
      gems: user.gems,
      experience: user.experience,
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
      completedQuestsCount: user.completedQuestsCount,
      postCount: user._count.posts,
      friendCount,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
}
