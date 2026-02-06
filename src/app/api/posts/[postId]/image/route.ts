import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // トークン付きURLでアクセスされた場合の検証
    const reqUrl = new URL(request.url);
    const tokenParam = reqUrl.searchParams.get('token');
    let tokenValidated = false;
    if (tokenParam) {
      try {
        const [expiresStr, sig] = tokenParam.split('.');
        const expires = Number(expiresStr);
        if (Number.isNaN(expires) || expires < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: '署名が期限切れです' }, { status: 401 });
        }
        const secret = process.env.SIGNED_URL_SECRET || '';
        const h = crypto.createHmac('sha256', secret).update(`${postId}:${expires}`).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(sig, 'hex'))) {
          return NextResponse.json({ error: '署名が不正です' }, { status: 401 });
        }
        // 署名検証成功 -> トークン認証として扱う
        tokenValidated = true;
      } catch (e) {
        console.error('Token validation failed', e);
        return NextResponse.json({ error: '署名検証に失敗しました' }, { status: 401 });
      }
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, imageUrl: true, userId: true, visibilityScope: true }
    });

    if (!post || !post.imageUrl) {
      return NextResponse.json({ error: '画像が見つかりません' }, { status: 404 });
    }

    // ビューアのトークン（オプション）
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    let viewerId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        viewerId = decoded.userId;
      } catch (e) {
        viewerId = null;
      }
    }

    // FRIENDS 公開は本人またはフレンドのみ
    if (post.visibilityScope === 'FRIENDS') {
      // トークン検証が成功していれば認可済みとみなす
      if (!tokenValidated) {
        if (!viewerId) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        if (viewerId !== post.userId) {
          const rel = await prisma.friend.findFirst({
            where: {
              OR: [
                { userId: post.userId, friendId: viewerId },
                { userId: viewerId, friendId: post.userId }
              ]
            }
          });
          if (!rel) return NextResponse.json({ error: '権限がありません' }, { status: 403 });
        }
      }
    }

    // ローカルの uploads なら直接ファイルを返す
    if (post.imageUrl.startsWith('/uploads')) {
      try {
        const p = path.join(process.cwd(), 'public', post.imageUrl.replace(/^\//, ''));
        const buf = await fs.readFile(p);
        const ext = path.extname(p).slice(1) || 'jpeg';
        const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        return new NextResponse(buf, { headers: { 'Content-Type': contentType } });
      } catch (e) {
        console.error('Local image read failed', e);
        return NextResponse.json({ error: '画像読み込み失敗' }, { status: 500 });
      }
    }

    // 外部（Cloudinary 等）はサーバー側でフェッチしてバイナリを返す（URLをクライアントに露出しない）
    try {
      // クエリを除去して取得元URLを単純化
      const src = post.imageUrl.split('?')[0];
      const res = await fetch(src);
      if (!res.ok) {
        console.error('Fetching remote image failed', src, res.status);
        return NextResponse.json({ error: '外部画像取得失敗' }, { status: 502 });
      }
      const arrayBuffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      return new NextResponse(Buffer.from(arrayBuffer), { headers: { 'Content-Type': contentType } });
    } catch (e) {
      console.error('Proxy remote image failed', e);
      return NextResponse.json({ error: '画像配信失敗' }, { status: 500 });
    }

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: '処理失敗' }, { status: 500 });
  }
}

