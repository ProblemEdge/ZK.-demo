'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PwaInstallRedirectClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const ua = navigator.userAgent || '';

      // Detect installed (standalone) mode
      const navAny = navigator as any;
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches || navAny.standalone === true;
      if (isStandalone) return;

      // check cookie explicitly for '1' or 'true'
      const cookie = document.cookie
        .split(';')
        .map((s) => s.trim())
        .find((c) => c.startsWith('pwa_installed='));
      const cookieVal = cookie ? cookie.split('=')[1] : undefined;
      if (cookieVal === '1' || cookieVal === 'true') return;

      // mobile UA detection + iPadOS desktop-class workaround
      const isMobileUa =
        /(android|iphone|ipad|ipod|mobile|windows phone|iemobile|opera mini|blackberry|bb10|crios|fxios)/i.test(
          ua,
        );
      const isIPadOS =
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1 &&
        /Macintosh/.test(ua);
      const isMobile = isMobileUa || isIPadOS;

      // Desktop/PC detection: if UA indicates desktop platform and there are no
      // mobile hints, treat as desktop to avoid redirecting desktop users.
      const isDesktopUa =
        /Windows NT|Macintosh|Linux x86_64|X11;/i.test(ua) &&
        !/(iphone|ipad|ipod|mobile|android)/i.test(ua);
      const isDesktop =
        isDesktopUa ||
        (typeof navigator.maxTouchPoints === 'number' &&
          navigator.maxTouchPoints === 0 &&
          /Macintosh|Windows|Linux/i.test(ua));

      // avoid redirect loop when already on /install or returning from install
      const fromInstallFlag = searchParams?.get('fromInstall');
      // Don't redirect desktop/PC users to the install flow
      if (!isMobile || isDesktop) return;
      if (pathname === '/install') return;
      if (fromInstallFlag === '1') return;

      // Redirect to install with returnTo
      const target = new URL('/install', window.location.origin);
      target.searchParams.set('returnTo', pathname + (window.location.search || ''));
      window.location.href = target.href;
    } catch (e) {
      // swallow errors to avoid breaking the app
      console.warn('PWA redirect check failed', e);
    }
  }, [pathname, searchParams]);

  return null;
}
