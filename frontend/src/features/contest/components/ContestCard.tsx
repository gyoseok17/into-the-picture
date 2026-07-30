import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AspectImage } from '@/components/AspectImage'
import { formatFilmMonth } from '@/lib/format'
import type { ContestSummary } from '../types'

export function ContestCard({ contest }: { contest: ContestSummary }) {
  return (
    <Link
      to={`/contests/${contest.id}`}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <AspectImage src={contest.thumbUrl} alt={contest.title} />
        <div className="space-y-1.5 p-3">
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary">{contest.awardGrade}</Badge>
            {contest.season ? (
              <Badge variant="outline">{contest.season}</Badge>
            ) : null}
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold">{contest.title}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {contest.location}
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {contest.photographer} · {formatFilmMonth(contest.filmMonth)}
          </p>
        </div>
      </Card>
    </Link>
  )
}

// 로딩 스켈레톤(그리드와 동일한 카드 형태).
export function ContestCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  )
}
