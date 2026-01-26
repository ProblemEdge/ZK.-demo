import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'ログアウトしました' });
  
  // Cookieを削除
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  return response;
}