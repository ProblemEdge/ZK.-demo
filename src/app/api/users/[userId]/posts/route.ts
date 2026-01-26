import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // ユーザーの承認済み投稿を取得
    const posts = await prisma.post.findMany({
      where: {
        userId,
        isApproved: true
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        postedAt: true
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 50
    });

    return NextResponse.json(posts);

  } catch (error) {
    console.error('Get user posts error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}
