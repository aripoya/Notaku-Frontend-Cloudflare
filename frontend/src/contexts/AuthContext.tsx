'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

const TOKEN_KEY = 'auth_token'; // Same as demo login!

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
  const [user, setUser] = useState<any>(null);
  const [backendToken, setBackendToken] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[AuthContext] ============================================');
    console.log('[AuthContext] Status:', status);
    console.log('[AuthContext] Session:', session);
    console.log('[AuthContext] ============================================');
    
    // PRIORITY 0: Check demo/mock login FIRST (from localStorage)
    // If demo login exists, skip NextAuth completely
    if (typeof window !== 'undefined') {
      const existingToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem('mock_user');
      
      // Demo login detected - skip NextAuth session check
      if (existingToken && existingToken.startsWith('mock_token_')) {
        console.log('[AuthContext] ✅ Demo/Mock login detected - skipping NextAuth');
        setBackendToken(existingToken);
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('[AuthContext] ✅ Demo user loaded from localStorage');
          } catch (e) {
            console.error('[AuthContext] Error parsing stored user:', e);
          }
        }
        
        setError(null);
        setIsLoading(false);
        return; // ← SKIP NextAuth checks!
      }
    }
    
    // Only check NextAuth if NOT demo login
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }
    
    const checkAuth = () => {
      // PRIORITY 1: Check NextAuth session (Google login)
      if (session && (session as any).backendToken) {
        console.log('[AuthContext] ✅ Found NextAuth session with backend token');
        
        const token = (session as any).backendToken || (session as any).accessToken;
        const userId = (session as any).userId;
        const userData = session.user;
        
        // CRITICAL: Store token same as demo login!
        if (typeof window !== 'undefined' && token) {
          console.log('[AuthContext] 💾 Storing token to localStorage...');
          localStorage.setItem(TOKEN_KEY, token);
          
          if (userData) {
            // Store user with same structure as demo login
            const userToStore = {
              id: userId || userData.email,
              email: userData.email,
              name: userData.name,
              image: userData.image,
              ...userData
            };
            localStorage.setItem('mock_user', JSON.stringify(userToStore));
            console.log('[AuthContext] ✅ Token and user stored to localStorage');
          }
        }
        
        setBackendToken(token);
        setUser(userData);
        setError(null);
        setIsLoading(false);
        return;
      }
      
      // Check for auth errors from backend (only for Google OAuth)
      if (session && (session as any).error) {
        const errorMsg = (session as any).errorMessage || 'Authentication failed with backend';
        console.error('[AuthContext] ❌ Google OAuth error:', errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        
        // Don't redirect if already on login/error page
        if (!pathname?.startsWith('/login') && !pathname?.startsWith('/auth/error')) {
          router.push('/login?error=backend_auth_failed');
        }
        return;
      }
      
      // PRIORITY 2: Check existing token (previous Google login)
      if (typeof window !== 'undefined') {
        const existingToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem('mock_user');
        
        if (existingToken) {
          console.log('[AuthContext] ✅ Found existing Google token in localStorage');
          setBackendToken(existingToken);
          
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              console.log('[AuthContext] ✅ Google user loaded from localStorage');
            } catch (e) {
              console.error('[AuthContext] Error parsing stored user:', e);
            }
          }
        } else {
          console.log('[AuthContext] ⚠️ No OAuth token found - user may use demo login');
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [status, session, router, pathname]);

  const value: AuthContextType = {
    user: user || session?.user || null,
    backendToken,
    userId: (session as any)?.userId || user?.id || null,
    isLoading,
    error,
    isAuthenticated: (!!backendToken || (!!session && !(session as any).error && status === 'authenticated')),
  };

  console.log('[AuthContext] Current state:', {
    isAuthenticated: value.isAuthenticated,
    hasToken: !!backendToken,
    hasUser: !!user,
    isLoading
  });

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
