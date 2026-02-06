import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 設定（upload と同一）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    // 可能であれば画像ファイルも削除（Cloudinary または public/uploads 内）
    try {
      if (post.imageUrl) {
        // Cloudinary にアップロードされたものなら public_id を推定して削除
        if (post.imageUrl.includes('res.cloudinary.com')) {
          try {
            const idx = post.imageUrl.indexOf('/upload/');
            if (idx !== -1) {
              let after = post.imageUrl.substring(idx + '/upload/'.length);
              // v{number}/ を取り除く
              after = after.replace(/^v\d+\//, '');
              const publicId = after.replace(/\.[^/.]+$/, '');
              await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            }
          } catch (err) {
            console.warn('Cloudinary画像削除失敗', err);
          }
        } else if (post.imageUrl.startsWith('/uploads')) {
          try {
            const p = path.join(process.cwd(), 'public', post.imageUrl.replace(/^\//, ''));
            await fs.unlink(p).catch(() => {});
          } catch (e) {
            console.warn('ローカル画像削除失敗', e);
          }
        }
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
