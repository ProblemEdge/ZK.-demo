import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true, visibilityScope: true } });
    if (!post) return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });

    // FRIENDS 公開はフレンドか本人のみ — それ以外（PUBLIC）は認証不要
    if (post.visibilityScope === 'FRIENDS') {
      // 認証トークンを確認
      const cookieHeader = request.headers.get('cookie');
      const token = cookieHeader
        ?.split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      if (!token) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

      let viewerId: string;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        viewerId = decoded.userId;
      } catch (e) {
        return NextResponse.json({ error: '認証エラー' }, { status: 401 });
      }

      if (viewerId !== post.userId) {
        const rel = await prisma.friend.findFirst({ where: { OR: [{ userId: post.userId, friendId: viewerId }, { userId: viewerId, friendId: post.userId }] } });
        if (!rel) return NextResponse.json({ error: '権限がありません' }, { status: 403 });
      }
    }

    // 署名を作成して image エンドポイントに渡す短命URLを生成
    const ttlSeconds = Number(process.env.SIGNED_URL_TTL_SECONDS || '300');
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const secret = process.env.SIGNED_URL_SECRET || '';
    const sig = crypto.createHmac('sha256', secret).update(`${postId}:${expires}`).digest('hex');
    const tokenParam = `${expires}.${sig}`;

    const url = `/api/posts/${postId}/image?token=${tokenParam}`;
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Signed image error:', error);
    return NextResponse.json({ error: '署名付きURLの生成に失敗しました' }, { status: 500 });
  }
}
