import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: Request) {
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

    // 自分の投稿を取得（承認済みのみ）
    const posts = await prisma.post.findMany({
      where: {
        userId: decoded.userId,
        isApproved: true
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 50 // 最新50件
    });

    return NextResponse.json(posts);

  } catch (error) {
    console.error('Get my posts error:', error);
    return NextResponse.json(
      { error: '認証エラー' },
      { status: 401 }
    );
  }
}