import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// コメントを削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { postId, commentId } = await params;
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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'コメントが見つかりません' },
        { status: 404 }
      );
    }

    // コメント作成者か確認
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'コメントを削除する権限がありません' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: 'コメント削除に失敗しました' },
      { status: 500 }
    );
  }
}
