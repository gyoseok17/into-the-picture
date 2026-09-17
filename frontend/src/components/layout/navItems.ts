import {
  CalendarClock,
  Compass,
  Images,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/contests', label: '수상작', icon: Trophy },
  { to: '/explore', label: '검색', icon: Compass },
  { to: '/crowd', label: '혼잡도', icon: CalendarClock },
  { to: '/me/album', label: '내 앨범', icon: Images },
  { to: '/me', label: '마이', icon: User },
]
