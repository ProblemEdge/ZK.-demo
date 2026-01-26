import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';

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
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    const filepath = join(uploadDir, filename);

    // フォルダが存在しない場合は作成
    await mkdir(uploadDir, { recursive: true });

    await writeFile(filepath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({
      message: 'アップロード成功',
      avatarUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}