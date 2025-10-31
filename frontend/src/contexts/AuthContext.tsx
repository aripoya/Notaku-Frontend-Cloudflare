'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { API_BASE_URL, API_PREFIX } from '@/lib/api-config';

const STORAGE_KEY_USER = 'current_user';

interface AuthUser {
  id: string;
  email: string;
  username?: string;
  preferred_name?: string;
  name?: string | null;
  image?: string | null;
  is_active?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const data = await (response.headers.get('content-type')?.includes('application/json')
    ? response.json()
    : response.text());
  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data?.message || 'Request failed');
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = useCallback((userData: AuthUser | null) => {
    if (typeof window === 'undefined') return;
    if (userData) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    console.log('[Auth] Starting auth check...');
    setIsLoading(true);

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_USER);
        if (saved) {
          try {
            const parsed: AuthUser = JSON.parse(saved);
            setUser(parsed);
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem(STORAGE_KEY_USER);
          }
        }
      }

      const data: AuthUser = await fetchJson(`${API_BASE_URL}${API_PREFIX}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      setUser(data);
      setIsAuthenticated(true);
      persistUser(data);
      console.log('[Auth] Auth check completed: authenticated');
    } catch (error) {
      console.warn('[Auth] Auth check failed or unauthenticated:', error);
      setUser(null);
      setIsAuthenticated(false);
      persistUser(null);
    } finally {
      setIsLoading(false);
      console.log('[Auth] isLoading set to false');
    }
  }, [persistUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await fetchJson(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const userData = (data as any)?.user ?? data;
      setUser(userData);
      setIsAuthenticated(true);
      persistUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, [persistUser]);

  const logout = useCallback(async () => {
    try {
      await fetchJson(`${API_BASE_URL}${API_PREFIX}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('[Auth] Logout request failed (continuing):', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      persistUser(null);
    }
  }, [persistUser]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
