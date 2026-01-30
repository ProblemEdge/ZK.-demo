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

    // ユーザー情報取得（カウントは除外して軽量化）
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
        experience: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(user);
    
    // 30秒キャッシュ（ユーザー情報はあまり変わらない）
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=10');
    
    return response;

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '認証エラー' },
      { status: 401 }
    );
  }
}