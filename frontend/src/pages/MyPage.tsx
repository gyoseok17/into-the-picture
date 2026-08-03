import { useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthProvider'

export default function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!user) return null

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
    <section className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">마이</h1>
        <p className="mt-1 text-sm text-muted-foreground">내 계정과 활동을 관리하세요.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="프로필" className="h-14 w-14 rounded-full border object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <UserRound className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="truncate">{user.nickname}</CardTitle>
            <CardDescription className="mt-1">카카오 계정으로 로그인됨</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" disabled={isLoggingOut} onClick={() => void handleLogout()}>
            <LogOut />
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
