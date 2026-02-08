import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/';

    const res = NextResponse.json({ ok: true, returnTo }, { status: 200 });
    // Client-readable cookie so installed status can be checked in middleware/client
    res.headers.set('Set-Cookie', 'pwa_installed=1; Path=/; Max-Age=31536000; SameSite=Lax');

    return res;
  } catch (e) {
    console.error('set pwa_installed error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request as unknown as Request);
}
