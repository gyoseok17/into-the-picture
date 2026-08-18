import { NavLink } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { navItems } from './navItems'

// 모바일/앱 전용 하단 탭바(데스크탑 md+에선 숨김). safe-area 하단 패딩 대응.
export function BottomTabBar() {
  const { user } = useAuth()
  const visibleNavItems = navItems.filter((item) => user || item.to !== '/me')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="주요 메뉴"
    >
      <ul className="mx-auto flex max-w-screen-sm items-stretch">
        {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
