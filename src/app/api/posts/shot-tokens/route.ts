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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const todayCount = await prisma.post.count({
      where: {
        userId: decoded.userId,
        postedAt: { gte: startOfToday }
      }
    });

    const limitPerDay = 5;
    const remaining = Math.max(0, limitPerDay - todayCount);

    return NextResponse.json({
      limit: limitPerDay,
      used: Math.min(todayCount, limitPerDay),
      remaining,
      resetAt: startOfTomorrow.toISOString()
    });

  } catch (error) {
    console.error('Get shot tokens error:', error);
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    );
  }
}
