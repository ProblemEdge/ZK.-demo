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

    jwt.verify(token, process.env.JWT_SECRET!);

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // 型チェックとサイズチェックのみ（検証を最小限に）
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    // サイズ制限を5MBに引き下げ（圧縮前提）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは5MB以下にしてください（アップロード前に圧縮してください）' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `post-${Date.now()}.${file.type.split('/')[1]}`;
    let imageUrl: string;

    // Vercel環境かローカルか判定
    if (process.env.VERCEL) {
      // Vercel環境：Base64でDataURLとして返却
      const base64 = buffer.toString('base64');
      imageUrl = `data:${file.type};base64,${base64}`;
    } else {
      // ローカル環境：ファイルシステムに保存
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'posts');
      
      await mkdir(uploadDir, { recursive: true });
      
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/posts/${filename}`;
    }

    return NextResponse.json({
      message: 'アップロード成功',
      imageUrl
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