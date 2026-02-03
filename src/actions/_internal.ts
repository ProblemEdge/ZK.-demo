import { cookies, headers } from 'next/headers';

const getBaseUrl = () => {
  const headerStore = headers();
  const host = headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') ?? 'http';

  if (!host) {
    throw new Error('Host header is missing');
  }

  return `${proto}://${host}`;
};

const getCookieHeader = () => {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
};

export const authFetch = async (path: string, init: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const cookieHeader = getCookieHeader();
  const headers = new Headers(init.headers);

  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store'
  });
};

export const parseJsonOrThrow = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
};
