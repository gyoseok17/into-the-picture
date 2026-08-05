import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AspectImage } from '@/components/AspectImage'
import { formatFilmMonth } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthProvider'
import { LoginRequiredDialog } from '@/features/favorite/components/LoginRequiredDialog'
import { FavoriteSaveErrorNotice } from '@/features/favorite/components/FavoriteSaveErrorNotice'
import { useFavoriteContests, useToggleContestFavorite } from '@/features/favorite/hooks/useFavorites'
import type { ContestSummary } from '../types'

export function ContestCard({ contest }: { contest: ContestSummary }) {
  const { user } = useAuth()
  const favorites = useFavoriteContests(Boolean(user))
  const toggleFavorite = useToggleContestFavorite(contest.id)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const favorite = favorites.data?.some((item) => item.contestId === contest.id) ?? false

  function handleFavorite(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault()
    event.stopPropagation()
    if (!user) { setShowLoginPrompt(true); return }
    toggleFavorite.mutate({ favorite, contest })
  }

  return <><Card className="group relative h-full overflow-hidden transition-shadow hover:shadow-md"><Link to={`/contests/${contest.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><AspectImage src={contest.thumbUrl} alt={contest.title} /><div className="space-y-1.5 p-3"><div className="flex flex-wrap items-center gap-1"><Badge variant="secondary">{contest.awardGrade}</Badge>{contest.season ? <Badge variant="outline">{contest.season}</Badge> : null}</div><h3 className="line-clamp-1 text-sm font-semibold">{contest.title}</h3><p className="line-clamp-1 text-xs text-muted-foreground">{contest.location}</p><p className="line-clamp-1 text-xs text-muted-foreground">{contest.photographer} · {formatFilmMonth(contest.filmMonth)}</p></div></Link><Button type="button" variant="secondary" size="icon" className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-sm" onClick={handleFavorite} disabled={Boolean(user && (favorites.isPending || toggleFavorite.isPending))} title={user ? (favorite ? '저장 해제' : '저장') : '로그인 후 저장'}><Heart className={`h-4 w-4 ${favorite ? 'fill-current text-rose-500' : ''}`} /><span className="sr-only">{favorite ? '저장 해제' : '저장'}</span></Button></Card><LoginRequiredDialog open={showLoginPrompt} returnTo={`/contests/${contest.id}`} onClose={() => setShowLoginPrompt(false)} /><FavoriteSaveErrorNotice open={toggleFavorite.isError} onClose={() => toggleFavorite.reset()} /></>
}

export function ContestCardSkeleton() {
  return <Card className="overflow-hidden"><Skeleton className="aspect-[4/3] w-full rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-5 w-14" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></Card>
}
