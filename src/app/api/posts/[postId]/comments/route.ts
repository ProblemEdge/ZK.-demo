import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '../../../utils/notifications';
import { prisma } from '@/lib/prisma';

// コメント一覧を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 10)) : 10;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10) || 0) : 0;

    const comments = await prisma.comment.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'コメント一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// コメントを作成
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'コメントを入力してください' },
        { status: 400 }
      );
    }

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

    // コメントを作成
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        text: text.trim()
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

    // 投稿者に通知（自分の投稿へのコメントでない場合）
    if (post.userId !== userId) {
      // 投稿が承認済みの場合のみコメント者を表示、投票中は匿名化
      const showCommentAuthor = post.isApproved;
      
      await sendNotificationToUser(
        post.userId,
        '💬 コメントが付きました',
        showCommentAuthor 
          ? `${comment.user.displayName || comment.user.username} がコメントしました`
          : 'コメントが付きました',
        `/feed`,
        showCommentAuthor ? userId : undefined, // 承認済みのみコメント者を表示
        'COMMENT_RECEIVED'
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'コメント作成に失敗しました' },
      { status: 500 }
    );
  }
}
