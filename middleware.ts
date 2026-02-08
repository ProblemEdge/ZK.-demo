import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 未認証の場合に `/login` へリダイレクトする簡易ミドルウェア。
// - Edge ランタイム向けで、JWT 検証は行わずクッキーの有無で判定します。
// - API や `_next` 等の内部パス、公開アセットはスキップします。

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // スキップ対象（公開パス）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/tutorial' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // ログイン後に戻すためのパスを付与
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // ここでは全パス実行し、上の条件でフィルタする実装にしています。
  matcher: '/:path*',
};
