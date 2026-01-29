import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// いいね一覧を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const likes = await prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json(likes);
  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json(
      { error: 'いいね一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// いいねを作成
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const userId = decoded.userId;

    // 投稿が存在するか確認
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 既にいいねしているか確認
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: '既にいいねしています' },
        { status: 400 }
      );
    }

    // いいねを作成
    const like = await prisma.like.create({
      data: {
        postId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error('Create like error:', error);
    return NextResponse.json(
      { error: 'いいねに失敗しました' },
      { status: 500 }
    );
  }
}

// いいねを削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const userId = decoded.userId;

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    if (!like) {
      return NextResponse.json(
        { error: 'いいねが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.like.delete({
      where: {
        postId_userId: { postId, userId }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete like error:', error);
    return NextResponse.json(
      { error: 'いいね削除に失敗しました' },
      { status: 500 }
    );
  }
}
