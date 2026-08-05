import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Heart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AspectImage } from '@/components/AspectImage'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { formatFilmMonth } from '@/lib/format'
import { useContestDetail } from '../hooks/useContestDetail'
import { useContestCrowd } from '../hooks/useContestCrowd'
import { ContestMap } from '../components/ContestMap'
import { CrowdCalendar } from '../components/CrowdCalendar'
import type { CrowdForecast } from '../types'
import { useAuth } from '@/features/auth/AuthProvider'
import { useContestFavoriteStatus, useToggleContestFavorite } from '@/features/favorite/hooks/useFavorites'
import { LoginRequiredDialog } from '@/features/favorite/components/LoginRequiredDialog'
import { FavoriteSaveErrorNotice } from '@/features/favorite/components/FavoriteSaveErrorNotice'

// 핵심 플로우(docs/04): 수상작 클릭 → 상세 + 좌표(지도/길안내) + 집중률 캘린더.
export default function ContestDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const isValidId = Number.isInteger(id) && id > 0

  const detailQuery = useContestDetail(id)
  const detail = detailQuery.data
  const { user } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const favoriteStatus = useContestFavoriteStatus(id, Boolean(user && isValidId))
  const toggleFavorite = useToggleContestFavorite(id)

  // crowdAvailable=true일 때만 호출(enabled). 204면 data=null → 섹션 숨김.
  const crowdQuery = useContestCrowd(id, detail?.crowdAvailable ?? false)

  function handleFavorite(): void {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    if (detail) toggleFavorite.mutate({ favorite: favoriteStatus.data?.favorite ?? false, contest: detail })
  }

  return (
    <article className="space-y-5">
      <Link
        to="/contests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> 수상작 목록
      </Link>

      {!isValidId ? (
        <ErrorState error={{ code: 'BAD_REQUEST', message: '잘못된 주소예요.' }} />
      ) : detailQuery.isPending ? (
        <DetailSkeleton />
      ) : detailQuery.isError ? (
        <ErrorState
          error={detailQuery.error}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : detail ? (
        <>
          <AspectImage
            src={detail.imageUrl}
            alt={detail.title}
            fit="contain"
            className="rounded-lg border bg-muted/40"
          />

          <header className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {detail.title}
              </h1>
              <Button
                variant="outline"
                size="sm"
                disabled={toggleFavorite.isPending || Boolean(user && favoriteStatus.isPending)}
                onClick={handleFavorite}
                className="shrink-0 gap-1.5"
                title={user ? undefined : '로그인 후 저장할 수 있어요'}
              >
                <Heart className={`h-4 w-4 ${favoriteStatus.data?.favorite ? 'fill-current text-rose-500' : ''}`} /> {favoriteStatus.data?.favorite ? '저장됨' : '저장'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{detail.awardGrade}</Badge>
              <Badge variant="outline">{detail.awardDivision}</Badge>
              {detail.season ? (
                <Badge variant="outline">{detail.season}</Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {detail.photographer} · {formatFilmMonth(detail.filmMonth)}
            </p>
            <p className="text-sm text-muted-foreground">{detail.location}</p>
          </header>

          {detail.keywords.length ? (
            <div className="flex flex-wrap gap-1">
              {detail.keywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="font-normal">
                  #{keyword}
                </Badge>
              ))}
            </div>
          ) : null}

          <Section title="위치">
            <ContestMap name={detail.title} lat={detail.lat} lng={detail.lng} />
          </Section>

          {detail.crowdAvailable ? (
            <CrowdSection
              isLoading={crowdQuery.isPending}
              isError={crowdQuery.isError}
              forecast={crowdQuery.data ?? null}
              onRetry={() => void crowdQuery.refetch()}
            />
          ) : null}
        </>
      ) : null}
      <LoginRequiredDialog open={showLoginPrompt} returnTo={`/contests/${id}`} onClose={() => setShowLoginPrompt(false)} />
      <FavoriteSaveErrorNotice open={toggleFavorite.isError} onClose={() => toggleFavorite.reset()} />
    </article>
  )
}

// 집중률 섹션: 매칭 실패(204→null)는 정상 흐름으로 숨김. 로딩/에러만 표시.
function CrowdSection({
  isLoading,
  isError,
  forecast,
  onRetry,
}: {
  isLoading: boolean
  isError: boolean
  forecast: CrowdForecast | null
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <Section title="방문 타이밍">
        <LoadingState label="집중률 불러오는 중…" />
      </Section>
    )
  }
  if (isError) {
    return (
      <Section title="방문 타이밍">
        <ErrorState onRetry={onRetry} />
      </Section>
    )
  }
  if (!forecast) return null

  return (
    <Section title="방문 타이밍" subtitle={forecast.attractionName}>
      <CrowdCalendar forecast={forecast} />
    </Section>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="aspect-[16/10] w-full rounded-lg" />
    </div>
  )
}
