import { useState } from 'react'
import { Heart, LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { AspectImage } from '@/components/AspectImage'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthProvider'
import { FavoriteSaveErrorNotice } from '@/features/favorite/components/FavoriteSaveErrorNotice'
import { useFavoriteContests, useToggleContestFavorite } from '@/features/favorite/hooks/useFavorites'
import type { FavoriteContest } from '@/features/favorite/types'

export default function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const favorites = useFavoriteContests()

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

      <section className="space-y-3">
        <div><h2 className="flex items-center gap-1.5 font-semibold"><Heart className="h-4 w-4 fill-current text-rose-500" /> 저장한 수상작</h2><p className="mt-1 text-sm text-muted-foreground">저장한 작품을 열어 다음 포토 비교에 활용할 수 있어요.</p></div>
        {favorites.isPending ? <LoadingState label="저장한 수상작을 불러오는 중…" /> : null}
        {favorites.isError ? <ErrorState error={favorites.error} onRetry={() => void favorites.refetch()} /> : null}
        {!favorites.isPending && !favorites.isError && favorites.data?.length === 0 ? <EmptyState title="저장한 수상작이 없어요" description="수상작 상세에서 하트를 눌러 저장해 보세요." /> : null}
        {favorites.data?.length ? <div className="grid gap-3 sm:grid-cols-2">{favorites.data.map((favorite) => <FavoriteContestCard key={favorite.favoriteId} favorite={favorite} />)}</div> : null}
      </section>
    </section>
  )
}

function FavoriteContestCard({ favorite }: { favorite: FavoriteContest }) {
  const toggleFavorite = useToggleContestFavorite(favorite.contestId)
  const { contest } = favorite

  function remove(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault()
    event.stopPropagation()
    toggleFavorite.mutate({ favorite: true, contest })
  }

  return <><Card className="group relative overflow-hidden transition-shadow hover:shadow-md"><Link to={`/contests/${contest.id}`} className="block"><AspectImage src={contest.thumbUrl} alt={contest.title} ratioClassName="aspect-[4/3]" /><div className="space-y-1 p-3"><p className="text-xs text-muted-foreground">{contest.awardGrade}</p><h3 className="line-clamp-2 font-medium">{contest.title}</h3><p className="line-clamp-1 text-xs text-muted-foreground">{contest.location}</p></div></Link><Button type="button" variant="secondary" size="icon" className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-sm" onClick={remove} disabled={toggleFavorite.isPending} title="저장 해제"><Heart className="h-4 w-4 fill-current text-rose-500" /><span className="sr-only">저장 해제</span></Button></Card><FavoriteSaveErrorNotice open={toggleFavorite.isError} onClose={() => toggleFavorite.reset()} /></>
}
