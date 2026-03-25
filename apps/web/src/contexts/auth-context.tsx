'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { login as loginService, logout as logoutService, getMe, register as registerService } from '@/services/auth'

interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ defaultOrg?: { slug: string } }>
  register: (name: string, email: string, password: string) => Promise<{ defaultOrg?: { slug: string } }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const u = await getMe()
      setUser(u)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const result = await loginService({ email, password })
    localStorage.setItem('accessToken', result.tokens.accessToken)
    localStorage.setItem('refreshToken', result.tokens.refreshToken)
    setUser(result.user)
    return result
  }

  const register = async (name: string, email: string, password: string) => {
    const result = await registerService({ name, email, password })
    localStorage.setItem('accessToken', result.tokens.accessToken)
    localStorage.setItem('refreshToken', result.tokens.refreshToken)
    setUser(result.user)
    return result
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try { await logoutService(refreshToken) } catch {}
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
