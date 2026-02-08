import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const returnTo = url.searchParams.get('returnTo') || '/';

    const res = NextResponse.json({ ok: true, returnTo }, { status: 200 });

    // Cookie must be readable from client-side JS (document.cookie),
    // so do NOT set HttpOnly. Max-Age 1 year.
    res.headers.set('Set-Cookie', 'pwa_installed=1; Path=/; Max-Age=31536000; SameSite=Lax');

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/';

    const response = NextResponse.json({ ok: true, returnTo });
    response.cookies.set('pwa_installed', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('set pwa_installed error', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
