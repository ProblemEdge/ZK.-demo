'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postCount: number;
  friendCount: number;
  level: number;
  gems: number;
  experience: number;
  currentStreak: number;
  maxStreak: number;
  completedQuestsCount: number;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setStatus('authenticated');
        try {
          localStorage.setItem('auth_user', JSON.stringify(data));
          localStorage.setItem('bottomNav_user', JSON.stringify(data));
        } catch {
          // noop
        }
        return;
      }
      setUser(null);
      setStatus('unauthenticated');
      try {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('bottomNav_user');
      } catch {
        // noop
      }
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('auth_user') || localStorage.getItem('bottomNav_user');
      if (cached) {
        setUser(JSON.parse(cached));
        setStatus('authenticated');
      }
    } catch {
      // noop
    }

    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回のみ実行

  const value = useMemo(() => ({ user, status, refresh, setUser }), [user, status, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
