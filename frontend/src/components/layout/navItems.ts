import {
  Compass,
  Trophy,
  CalendarClock,
  Images,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  // 루트('/')는 정확 매칭, 나머지는 하위 경로까지 활성.
  end?: boolean
}

// 하단 탭(모바일)·상단 네비(데스크탑)가 공유하는 단일 소스(docs/08).
export const navItems: NavItem[] = [
  { to: '/contests', label: '수상작', icon: Trophy },
  { to: '/', label: '검색', icon: Compass, end: true },
  { to: '/crowd', label: '혼잡도', icon: CalendarClock },
  { to: '/compare', label: '사진 놓기', icon: Images },
  { to: '/me', label: '마이', icon: User },
]
