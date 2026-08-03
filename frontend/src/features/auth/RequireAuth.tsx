import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingState } from '@/components/state/LoadingState'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { user, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <LoadingState />
  if (!user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  return <Outlet />
}
