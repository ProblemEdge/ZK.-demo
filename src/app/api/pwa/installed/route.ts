import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/';

    const res = NextResponse.json({ ok: true, returnTo }, { status: 200 });
    // Set a session-only, client-readable cookie so installed status can be
    // checked in middleware/client. Avoid persistent caching on the server
    // side by not using Max-Age and marking the response as non-cacheable.
    res.headers.set('Set-Cookie', 'pwa_installed=1; Path=/; SameSite=Lax');
    res.headers.set('Cache-Control', 'no-store');

    return res;
  } catch (e) {
    console.error('set pwa_installed error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request as unknown as Request);
}
