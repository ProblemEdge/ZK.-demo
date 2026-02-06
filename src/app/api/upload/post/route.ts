import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    // 認証不要: 公開アップロード（Cloudinary 側で unsigned preset を使う場合はクライアント側で設定してください）

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

    // Cloudinaryにアップロード
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'matsumoto-now/posts',
      resource_type: 'image',
      transformation: [
        { width: 1080, height: 1080, crop: 'limit' }, // 最大1080x1080にリサイズ
        { quality: 'auto:good' }, // 自動品質最適化
        { fetch_format: 'auto' } // 自動フォーマット変換（WebP等）
      ]
    });

    const imageUrl = uploadResult.secure_url;

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