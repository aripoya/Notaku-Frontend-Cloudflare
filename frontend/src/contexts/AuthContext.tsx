// src/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id?: string
  email?: string
  name?: string
  image?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AuthContext] Session status:', status)
    console.log('[AuthContext] Session data:', session)
    
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'authenticated' && session?.user) {
      // Sync NextAuth session with AuthContext
      const userData = {
        id: (session.user as any).id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        image: session.user.image || '',
        role: (session.user as any).role || 'user',
      }
      
      console.log('[AuthContext] Setting user:', userData)
      setUser(userData)
      setIsLoading(false)
      setError(null)
    } else if (status === 'unauthenticated') {
      console.log('[AuthContext] User not authenticated')
      setUser(null)
      setIsLoading(false)
      setError(null)
    }
  }, [session, status])

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
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
