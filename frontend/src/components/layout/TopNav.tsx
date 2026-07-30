import { Link, NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { navItems } from './navItems'

// 데스크탑(md+) 전용 상단 네비. 모바일에선 숨기고 BottomTabBar를 쓴다.
export function TopNav() {
  return (
    <header className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur md:block">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center gap-6 px-6">
        <Link to="/" className="text-base font-semibold tracking-tight">
          Into the Picture
        </Link>
        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
