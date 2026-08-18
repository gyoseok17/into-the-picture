import { useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { navItems } from './navItems'

// 데스크탑(md+) 전용 상단 네비. 모바일에선 숨기고 BottomTabBar를 쓴다.
export function TopNav() {
  const { user, isBootstrapping, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const visibleNavItems = navItems.filter((item) => item.to !== '/me')
  const returnTo = `${location.pathname}${location.search}${location.hash}`

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/70 bg-background/90 backdrop-blur-md md:block">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-screen-xl items-center gap-8 px-8">
        <Link to="/" className="font-editorial text-lg font-semibold tracking-[-0.04em]">
          Into the Picture
        </Link>
        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          {!isBootstrapping && user ? (
            <>
              <details className="group relative">
                <summary className="flex max-w-48 cursor-pointer list-none items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
                  <span className="truncate" title={user.nickname}>{user.nickname}님</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 mt-2 w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                  <Link to="/me" className="block rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent">
                    마이
                  </Link>
                </div>
              </details>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </>
          ) : !isBootstrapping ? (
            <Link
              to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              로그인
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
