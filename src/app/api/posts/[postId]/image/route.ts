import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { imageUrl: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ imageUrl: post.imageUrl });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: '画像取得に失敗しました' },
      { status: 500 }
    );
  }
}
