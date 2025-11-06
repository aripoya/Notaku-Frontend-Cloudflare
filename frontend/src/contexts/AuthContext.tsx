'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import ApiClient from '@/lib/api-client';
import { useAuthStore, type User } from '@/hooks/useAuth';

type RegisterPayload = {
  email: string;
  password: string;
  username?: string;
  name?: string;
  full_name?: string;
  preferred_name?: string;
  [key: string]: any;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const noop = async () => {};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: noop,
  register: noop,
  logout: noop,
  refreshUser: noop,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeLoading = useAuthStore((s) => s.isLoading);

  const storeLogin = useAuthStore((s) => s.login);
  const storeRegister = useAuthStore((s) => s.register);
  const storeLogout = useAuthStore((s) => s.logout);
  const storeCheckAuth = useAuthStore((s) => s.checkAuth);

  const setAuthFromSession = useAuthStore((s) => s.setAuthFromSession);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [error, setError] = useState<string | null>(null);
  const triedLocalRef = useRef(false);

  // Helper: mapping aman dari apa pun bentuk user
  const mapUser = useCallback((raw: any): Partial<User> | null => {
    if (!raw) return null;
    return {
      id: String(raw.id ?? raw.user_id ?? raw.sub ?? ''),
      email: raw.email ?? undefined,
      name:
        raw.preferred_name ??
        raw.full_name ??
        raw.name ??
        raw.username ??
        raw.email ??
        undefined,
      full_name: raw.full_name ?? raw.name ?? undefined,
      preferred_name: raw.preferred_name ?? undefined,
      username: raw.username ?? undefined,
      role: raw.role ?? raw.user_role ?? 'user',
      tier: raw.subscription_tier ?? raw.tier ?? undefined,
      image: raw.image ?? raw.avatar ?? null,
      businessName: raw.businessName ?? raw.business_name ?? undefined,
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const current = await ApiClient.getCurrentUser();
      const mapped = mapUser(current);
      setAuth(mapped);
      setError(null);
    } catch (err: any) {
      if (err?.statusCode !== 401) {
        console.error('[AuthContext] refreshUser error:', err);
      }
      clearAuth();
      setError(err?.message ?? null);
    }
  }, [mapUser, setAuth, clearAuth]);

  // Delegasi aksi utama ke store (supaya satu sumber kebenaran)
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await storeLogin(email, password);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Login failed');
        throw err;
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: RegisterPayload) => {
      try {
        await storeRegister(data);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Registration failed');
        throw err;
      }
    },
    [storeRegister]
  );

  const logout = useCallback(async () => {
    try {
      await storeLogout();
      if (status === 'authenticated') {
        await signOut({ redirect: false });
      }
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
    } catch (err) {
      console.error('[AuthContext] logout error:', err);
    } finally {
      setError(null);
      triedLocalRef.current = false;
    }
  }, [storeLogout, status]);

  // Bootstrapping: NextAuth → Store → (fallback) Backend session
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      const u = mapUser({
        id: (session.user as any).id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        image: session.user.image || '',
        role: (session.user as any).role || 'user',
      });
      setAuthFromSession(u ?? {});
      
      // Store backend accessToken to localStorage and zustand for analytics API
      if ((session as any).accessToken) {
        const token = (session as any).accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          console.log('[AuthContext] Stored accessToken to localStorage');
        }
        // Also update zustand store with token
        setAuth(u ?? {}, token);
      }
      
      setError(null);
      triedLocalRef.current = false; // reset flag
      return;
    }

    // unauthenticated → coba local session SEKALI
    if (!triedLocalRef.current) {
      triedLocalRef.current = true;
      // Jangan block UI berlebihan; store punya isLoading sendiri
      storeCheckAuth().catch(() => {
        // ignore; store sudah set flag ke false
      });
    }
  }, [status, session, mapUser, setAuthFromSession, storeCheckAuth]);

  // Loading gabungan: tunggu NextAuth atau proses store
  const isLoading = status === 'loading' || storeLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
