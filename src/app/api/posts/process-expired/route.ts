import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function GET(request: Request) {
  try {
    // 期限付き表示設定のある投稿をすべて取得して、期限切れのものを削除する
    const posts = await prisma.post.findMany({
      where: { visibilityDurationMinutes: { not: null } },
      select: { id: true, imageUrl: true, postedAt: true, visibilityDurationMinutes: true }
    });

    const now = Date.now();
    const expired = posts.filter(p => {
      const duration = p.visibilityDurationMinutes ?? 0;
      return new Date(p.postedAt).getTime() < (now - duration * 60 * 1000);
    });

    for (const post of expired) {
      try {
        // 関連データをトランザクションで削除
        await prisma.$transaction([
          prisma.like.deleteMany({ where: { postId: post.id } }),
          prisma.vote.deleteMany({ where: { postId: post.id } }),
          prisma.comment.deleteMany({ where: { postId: post.id } }),
          prisma.report.deleteMany({ where: { postId: post.id } }),
          prisma.post.delete({ where: { id: post.id } })
        ]);

        // 画像ファイルも削除
        if (post.imageUrl) {
          if (post.imageUrl.includes('res.cloudinary.com')) {
            try {
              const idx = post.imageUrl.indexOf('/upload/');
              if (idx !== -1) {
                let after = post.imageUrl.substring(idx + '/upload/'.length);
                after = after.replace(/^v\d+\//, '');
                const publicId = after.replace(/\.[^/.]+$/, '');
                await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
              }
            } catch (err) {
              console.warn('Cloudinary delete failed', err);
            }
          } else if (post.imageUrl.startsWith('/uploads')) {
            try {
              const p = path.join(process.cwd(), 'public', post.imageUrl.replace(/^\//, ''));
              await fs.unlink(p).catch(() => {});
            } catch (e) {
              console.warn('Local file delete failed', e);
            }
          }
        }
      } catch (err) {
        console.error('Failed to delete expired post', post.id, err);
      }
    }

    return NextResponse.json({ deleted: expired.length });
  } catch (error) {
    console.error('Process expired posts error:', error);
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 });
  }
}
