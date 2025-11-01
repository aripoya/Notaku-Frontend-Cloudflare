// src/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import ApiClient from '@/lib/api-client'

interface User {
  id?: string
  email?: string
  name?: string
  image?: string | null
  role?: string
  username?: string
  full_name?: string
  preferred_name?: string
  subscription_tier?: string | null
  businessName?: string | null
  [key: string]: any
}

type RegisterPayload = {
  email: string
  password: string
  username?: string
  name?: string
  full_name?: string
  preferred_name?: string
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const noop = async () => {}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: noop,
  register: noop,
  logout: noop,
  refreshUser: noop,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapUser = useCallback((raw: any): User | null => {
    if (!raw) return null
    return {
      ...raw,
      id: raw.id ?? raw.user_id ?? raw.sub ?? undefined,
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
      subscription_tier: raw.subscription_tier ?? raw.tier ?? null,
      image: raw.image ?? raw.avatar ?? null,
      businessName: raw.businessName ?? raw.business_name ?? null,
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const current = await ApiClient.getCurrentUser()
      const mapped = mapUser(current)
      setUser(mapped)
      setIsAuthenticated(!!mapped)
      setError(null)
    } catch (err: any) {
      if (err?.statusCode !== 401) {
        console.error('[AuthContext] refreshUser error:', err)
      }
      setUser(null)
      setIsAuthenticated(false)
      setError(err?.message ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [mapUser])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await ApiClient.login({ email, password })
      const mapped = mapUser(response.user)
      setUser(mapped)
      setIsAuthenticated(true)
      setError(null)
      if (!mapped?.email) {
        await refreshUser()
      }
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [mapUser, refreshUser])

  const register = useCallback(async (data: RegisterPayload) => {
    setIsLoading(true)
    try {
      const response = await ApiClient.register(data)
      const mapped = mapUser(response.user)
      setUser(mapped)
      setIsAuthenticated(true)
      setError(null)
      if (!mapped?.email) {
        await refreshUser()
      }
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [mapUser, refreshUser])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await ApiClient.logout()
      if (status === 'authenticated') {
        await signOut({ redirect: false })
      }
    } catch (err) {
      console.error('[AuthContext] logout error:', err)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
      setError(null)
    }
  }, [])

  useEffect(() => {
    console.log('[AuthContext] Session status:', status)
    console.log('[AuthContext] Session data:', session)
    
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'authenticated' && session?.user) {
      // Sync NextAuth session with AuthContext
      const userData = mapUser({
        id: (session.user as any).id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        image: session.user.image || '',
        role: (session.user as any).role || 'user',
      })
      
      console.log('[AuthContext] Setting user from NextAuth:', userData)
      setUser(userData)
      setIsAuthenticated(true)
      setIsLoading(false)
      setError(null)
    } else if (status === 'unauthenticated') {
      console.log('[AuthContext] User not authenticated via NextAuth, falling back to local session')
      refreshUser()
    }
  }, [mapUser, refreshUser, session, status])

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
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
