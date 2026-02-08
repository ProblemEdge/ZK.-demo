'use client';

import { useEffect } from 'react';
import posthog from '../../lib/instrumentation-client';

export default function PostHogClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // expose to window for quick console checks
    try {
      (window as any).posthog = posthog;
    } catch (e) {
      // noop
    }
  }, []);

  return null;
}
