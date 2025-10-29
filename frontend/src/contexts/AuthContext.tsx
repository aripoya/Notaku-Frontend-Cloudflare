'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: any;
  backendToken: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  backendToken: null,
  userId: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[AuthContext] Status changed:', status);
    console.log('[AuthContext] Session:', session);
    
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }
    
    setIsLoading(false);
    
    // Check for auth errors from backend
    if (session && (session as any).error) {
      const errorMsg = (session as any).errorMessage || 'Authentication failed with backend';
      console.error('[AuthContext] ❌ Auth error:', errorMsg);
      setError(errorMsg);
      
      // Don't redirect if already on login/error page
      if (!pathname?.startsWith('/login') && !pathname?.startsWith('/auth/error')) {
        router.push('/login?error=backend_auth_failed');
      }
      return;
    }
    
    // Clear error if session is valid
    if (session && !(session as any).error) {
      setError(null);
    }
    
  }, [status, session, router, pathname]);

  const value: AuthContextType = {
    user: session?.user || null,
    backendToken: (session as any)?.backendToken || null,
    userId: (session as any)?.userId || null,
    isLoading,
    error,
    isAuthenticated: !!session && !(session as any).error && status === 'authenticated',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
