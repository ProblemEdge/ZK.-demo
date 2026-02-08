import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 未認証の場合に `/login` へリダイレクトする簡易ミドルウェア。
// - Edge ランタイム向けで、JWT 検証は行わずクッキーの有無で判定します。
// - API や `_next` 等の内部パス、公開アセットはスキップします。

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // スキップ対象（公開パス）
  // - Next.js 内部、API は常にスキップ
  // - PWA 関連ファイルやログイン/登録ページはスキップ
  // - public 配下の静的ファイルはURL上に `/public` を含まないため、
  //   ここでは拡張子を持つリクエストや既知の公開フォルダを個別に許可する
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    // keep assets, SW, manifest accessible for PWA install flow
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/tutorial' ||
    pathname === '/install' ||
    pathname === '/admin'
  ) {
    return NextResponse.next();
  }

  // 拡張子があるリクエストは静的アセット（画像/アイコン/フォント等）とみなしてスキップ
  if (/\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 公開フォルダのいくつかは明示的に許可（例: /icon, /badge, /uploads）
  if (
    pathname.startsWith('/icon') ||
    pathname.startsWith('/badge') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  // モバイルの場合、PWA インストール済みフラグが無ければ `/install` へ誘導する
  // ここを認証チェックより前に置くことで、`/install` を除く全ページを対象にする
  const pwaInstalledValue = request.cookies.get('pwa_installed')?.value;
  // treat installed only when cookie explicitly set to '1' or 'true'
  const pwaInstalled = pwaInstalledValue === '1' || pwaInstalledValue === 'true';
  const ua = request.headers.get('user-agent') || '';
  // broader mobile UA detection to catch various mobile UAs (incl. iOS Chrome/Safari variants)
  const isMobile =
    /(android|iphone|ipad|ipod|mobile|windows phone|iemobile|opera mini|blackberry|bb10|crios|fxios)/i.test(
      ua,
    );

  // Desktop/PC detection: treat common desktop user agents as desktop to avoid
  // redirecting desktop/PC users to the install flow.
  const isDesktopUa =
    /Windows NT|Macintosh|Linux x86_64|X11;/i.test(ua) &&
    !/(iphone|ipad|ipod|mobile|android)/i.test(ua);
  const isDesktop = isDesktopUa;

  // allow a one-time bypass when returning from the install flow
  const fromInstallFlag = request.nextUrl.searchParams.get('fromInstall');

  // Only redirect when we positively detect a mobile device and not a desktop/PC
  if (
    isMobile &&
    !isDesktop &&
    !pwaInstalled &&
    pathname !== '/install' &&
    fromInstallFlag !== '1'
  ) {
    const installUrl = new URL('/install', request.url);
    installUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(installUrl);
  }

  const token = request.cookies.get('auth-token')?.value;
  // Prevent redirect loop: allow the /login page itself to be reachable
  if (!token && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    // ログイン後に戻すためのパスを付与
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  // debug headers for troubleshooting in network tab (remove in production)
  try {
    res.headers.set('x-pwa-mobile', String(isMobile));
    res.headers.set('x-pwa-installed', String(pwaInstalled));
    // include truncated UA for debugging (do not expose full UA in prod)
    res.headers.set('x-pwa-ua', ua.slice(0, 120));
  } catch (e) {
    // ignore header errors
  }

  return res;
}

export const config = {
  // ここでは全パス実行し、上の条件でフィルタする実装にしています。
  matcher: '/:path*',
};
