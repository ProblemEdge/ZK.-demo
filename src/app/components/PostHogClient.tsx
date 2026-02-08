'use client';

import { useEffect } from 'react';
import posthog from '../../lib/instrumentation-client';

export default function PostHogClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // expose to window for quick console checks
    try {
      (window as any).posthog = posthog;
      // debug: print basic info even when network requests are blocked by extensions
      // eslint-disable-next-line no-console
      console.info('PostHog mounted (client):', {
        hasPosthog: !!posthog,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      });
    } catch (e) {
      // noop
    }
  }, []);

  return null;
}
