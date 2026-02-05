import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

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
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    // 関連データを削除（安全のため明示的に）
    await prisma.$transaction([
      prisma.like.deleteMany({ where: { postId } }),
      prisma.vote.deleteMany({ where: { postId } }),
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.report.deleteMany({ where: { postId } }),
      prisma.post.delete({ where: { id: postId } })
    ]);

    // 可能であれば画像ファイルも削除（public/uploads 内）
    try {
      if (post.imageUrl && post.imageUrl.startsWith('/uploads')) {
        const p = path.join(process.cwd(), 'public', post.imageUrl.replace(/^\//, ''));
        await fs.unlink(p).catch(() => {});
      }
    } catch (e) {
      // ファイル削除失敗は許容する
      console.warn('画像ファイルの削除に失敗しました', e);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 });
  }
}
