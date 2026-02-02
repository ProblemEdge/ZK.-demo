import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json();

    // 環境変数からアクセスキーを取得（.envに設定）
    const validKey = process.env.ADMIN_ACCESS_KEY || 'your-secret-key';

    if (accessKey === validKey) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid access key' }, { status: 401 });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
