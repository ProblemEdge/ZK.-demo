import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
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

    const { imageUrl, caption, tags } = await request.json();

    if (!imageUrl || !caption) {
      return NextResponse.json(
        { error: '画像とキャプションは必須です' },
        { status: 400 }
      );
    }

    if (caption.length > 300) {
      return NextResponse.json(
        { error: 'キャプションは300文字以内にしてください' },
        { status: 400 }
      );
    }

    // β版のため投稿間隔制限を削除

    const post = await prisma.post.create({
      data: {
        userId: decoded.userId,
        imageUrl,
        caption,
        tags: tags || '',
        isApproved: false,
        approvalScore: 0
      }
    });

    return NextResponse.json({
      message: '投稿しました！投票で承認されるまでお待ちください。',
      post: {
        id: post.id,
        isApproved: false
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: '投稿に失敗しました' },
      { status: 500 }
    );
  }
}