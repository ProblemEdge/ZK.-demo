import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const { displayName, bio, avatarUrl } = await request.json();

    // バリデーション
    if (displayName && displayName.length > 50) {
      return NextResponse.json(
        { error: '表示名は50文字以内にしてください' },
        { status: 400 }
      );
    }

    if (bio && bio.length > 200) {
      return NextResponse.json(
        { error: '自己紹介は200文字以内にしてください' },
        { status: 400 }
      );
    }

    // プロフィール更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        displayName: displayName || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null
      }
    });

    return NextResponse.json({
      message: 'プロフィールを更新しました',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'プロフィール更新に失敗しました' },
      { status: 500 }
    );
  }
}