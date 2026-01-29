import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイル検証
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB制限
      return NextResponse.json(
        { error: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 }
      );
    }

    // ファイル保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `avatar-${decoded.userId}-${Date.now()}.${file.type.split('/')[1]}`;
    let avatarUrl: string;

    // Vercel環境かローカルか判定
    if (process.env.VERCEL) {
      // Vercel環境：Base64でデータベースに保存
      const base64 = buffer.toString('base64');
      avatarUrl = `data:${file.type};base64,${base64}`;
    } else {
      // ローカル環境：ファイルシステムに保存
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
      const filepath = join(uploadDir, filename);

      // フォルダが存在しない場合は作成
      await mkdir(uploadDir, { recursive: true });

      await writeFile(filepath, buffer);
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    // ユーザーのアバターURLを更新
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { avatarUrl }
    });

    return NextResponse.json({
      message: 'アップロード成功',
      avatarUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}