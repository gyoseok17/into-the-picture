import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import axios from 'axios'

import { API_BASE } from '@/lib/env'
import { clearLegacyRefreshToken, setAccessToken } from '@/lib/tokenStore'
import { subscribeToAuthExpired } from '@/lib/authSessionEvents'
import type { AuthResponse, AuthUser } from '@/lib/apiClient'
import { loginWithKakao, logout as logoutRequest } from './api'

interface AuthContextValue {
  user: AuthUser | null
  isBootstrapping: boolean
  loginWithKakaoCode(authorizationCode: string, redirectUri: string): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// React StrictMode remounts effects in development. Keep the refresh-token
// rotation request shared so both mounts cannot submit the same cookie.
let bootstrapRequest: Promise<AuthResponse | null> | null = null
let sessionGeneration = 0

function isKakaoAuthorizationCallback(): boolean {
  return window.location.pathname === '/login' && new URLSearchParams(window.location.search).has('code')
}

function requestBootstrapSession(): Promise<AuthResponse | null> {
  if (bootstrapRequest) return bootstrapRequest

  const request = (async (): Promise<AuthResponse | null> => {
    try {
      const { data } = await axios.post<AuthResponse>(`${API_BASE}/auth/refresh`, undefined, { withCredentials: true })
      return data
    } catch {
      return null
    }
  })()

  bootstrapRequest = request
  void request.finally(() => {
    if (bootstrapRequest === request) bootstrapRequest = null
  })
  return request
}

async function saveSession(session: AuthResponse): Promise<void> {
  setAccessToken(session.accessToken)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => subscribeToAuthExpired(() => {
    setUser(null)
    setIsBootstrapping(false)
  }), [])

  useEffect(() => {
    let active = true
    async function bootstrap(): Promise<void> {
      await clearLegacyRefreshToken()
      // The login page will exchange this code momentarily. A refresh attempt
      // before that exchange only produces an expected-but-noisy 401.
      if (isKakaoAuthorizationCallback()) return
      const generationAtStart = sessionGeneration
      const session = await requestBootstrapSession()

      // Never let a cleaned-up StrictMode effect write tokens or React state.
      // A login or logout while refresh was pending owns the newer session.
      if (!active || generationAtStart !== sessionGeneration) return

      if (session) {
        await saveSession(session)
        if (active) setUser(session.user)
      } else {
        setAccessToken(null)
      }
    }
    void bootstrap().finally(() => {
      if (active) setIsBootstrapping(false)
    })
    return () => { active = false }
  }, [])

  const loginWithKakaoCode = useCallback(async (authorizationCode: string, redirectUri: string) => {
    const session = await loginWithKakao(authorizationCode, redirectUri)
    await saveSession(session)
    sessionGeneration += 1
    setUser(session.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      sessionGeneration += 1
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, isBootstrapping, loginWithKakaoCode, logout }), [user, isBootstrapping, loginWithKakaoCode, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
