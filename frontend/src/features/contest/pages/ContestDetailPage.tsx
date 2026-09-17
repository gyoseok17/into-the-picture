import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart, Images, X } from 'lucide-react'

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
import { CrowdCalendar, CrowdUnavailableNotice } from '../components/CrowdCalendar'
import type { CrowdForecast } from '../types'
import { useAuth } from '@/features/auth/AuthProvider'
import { useContestFavoriteStatus, useToggleContestFavorite } from '@/features/favorite/hooks/useFavorites'
import { LoginRequiredDialog } from '@/features/favorite/components/LoginRequiredDialog'
import { FavoriteSaveErrorNotice } from '@/features/favorite/components/FavoriteSaveErrorNotice'
import { ContestComparisonEntry } from '@/features/comparison/components/ContestComparisonEntry'
import { PublicContestComparisonGallery } from '@/features/comparison/components/PublicContestComparisonGallery'
import { PhotoComparisonResultDialog } from '@/features/comparison/components/PhotoComparisonResultDialog'
import { useComparisons, usePublicContestComparisons } from '@/features/comparison/hooks/useComparison'

// 핵심 플로우(docs/04): 수상작 클릭 → 상세 + 좌표(지도/길안내) + 집중률 캘린더.
export default function ContestDetailPage() {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const id = Number(params.id)
  const isValidId = Number.isInteger(id) && id > 0

  const detailQuery = useContestDetail(id)
  const detail = detailQuery.data
  const { user } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showPublicComparisons, setShowPublicComparisons] = useState(false)
  const [showSavedComparison, setShowSavedComparison] = useState(false)
  const savedComparisonTriggerRef = useRef<HTMLButtonElement>(null)
  const favoriteStatus = useContestFavoriteStatus(id, Boolean(user && isValidId))
  const toggleFavorite = useToggleContestFavorite(id)
  const comparisons = useComparisons(Boolean(user && isValidId))
  const contestComparisons = comparisons.data?.filter((comparison) => comparison.contest.id === id) ?? []
  const existingComparison = contestComparisons[0]
  const publicComparisons = usePublicContestComparisons(id, isValidId && showPublicComparisons)
  const openedFromContestList = location.state?.contestListEntry === true

  const handleListReturn = useCallback((): void => {
    if (openedFromContestList) {
      navigate(-1)
      return
    }

    navigate('/contests')
  }, [navigate, openedFromContestList])

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
    <DetailPresentation overlay={openedFromContestList} onClose={handleListReturn} suspendEscape={showPublicComparisons || showSavedComparison}>
    <article className="space-y-5">
      <button
        type="button"
        onClick={handleListReturn}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> 수상작 목록
      </button>

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
          <div className="relative">
            <AspectImage
              src={detail.imageUrl}
              alt={detail.title}
              fit="contain"
              className="rounded-lg border bg-muted/40"
            />
            {favoriteStatus.data?.favorite && existingComparison ? <div className="absolute bottom-3 right-3"><ContestComparisonEntry contestId={id} comparison={existingComparison} onOpen={() => setShowSavedComparison(true)} triggerRef={savedComparisonTriggerRef} /></div> : null}
          </div>

          <header className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {detail.title}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
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
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="이 작품과 비교한 사진 보기"
                title="이 작품과 비교한 사진 보기"
                onClick={() => setShowPublicComparisons(true)}
              >
                <Images className="h-4 w-4" aria-hidden />
              </Button>
              {favoriteStatus.data?.favorite && !existingComparison ? <Button asChild size="sm" className="shrink-0"><Link to={`/me/album?contestId=${id}`}>수상작 비교</Link></Button> : null}
              </div>
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

          <CrowdSection
            isLoading={crowdQuery.isPending}
            isError={crowdQuery.isError}
            forecast={crowdQuery.data ?? null}
            onRetry={() => void crowdQuery.refetch()}
          />
        </>
      ) : null}
      <LoginRequiredDialog open={showLoginPrompt} returnTo={`/contests/${id}`} onClose={() => setShowLoginPrompt(false)} />
      <FavoriteSaveErrorNotice open={toggleFavorite.isError} onClose={() => toggleFavorite.reset()} />
      {showPublicComparisons ? (
        <PublicComparisonDialog
          comparisons={publicComparisons.data ?? []}
          isLoading={publicComparisons.isPending || Boolean(user && comparisons.isPending)}
          error={publicComparisons.isError ? publicComparisons.error : null}
          onRetry={() => void publicComparisons.refetch()}
          onClose={() => setShowPublicComparisons(false)}
          contestImageUrl={detail?.imageUrl ?? ''}
          contestTitle={detail?.title ?? '수상작 원본'}
        />
      ) : null}
      {showSavedComparison && contestComparisons.length ? (
        <PhotoComparisonResultDialog
          comparisons={contestComparisons}
          initialComparisonId={existingComparison.id}
          returnFocusRef={savedComparisonTriggerRef}
          onClose={() => setShowSavedComparison(false)}
        />
      ) : null}
    </article>
    </DetailPresentation>
  )
}

function DetailPresentation({
  overlay,
  onClose,
  suspendEscape = false,
  children,
}: {
  overlay: boolean
  onClose: () => void
  suspendEscape?: boolean
  children: ReactNode
}) {
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const suspendEscapeRef = useRef(suspendEscape)

  useEffect(() => {
    suspendEscapeRef.current = suspendEscape
  }, [suspendEscape])

  useEffect(() => {
    if (!overlay) return

    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !suspendEscapeRef.current) {
        event.preventDefault()
        onClose()
        return
      }
      if (suspendEscapeRef.current) return
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('hidden'))
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      const returnFocusTarget = returnFocusRef.current
      window.requestAnimationFrame(() => returnFocusTarget?.focus())
    }
  }, [onClose, overlay])

  if (!overlay) return <>{children}</>

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="수상작 상세"
      className="fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-background md:top-[4.25rem]"
    >
      <div ref={dialogRef} tabIndex={-1} className="mx-auto w-full max-w-screen-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 outline-none md:px-8 md:pb-14 md:pt-9">
        {children}
      </div>
    </div>
  )
}

function PublicComparisonDialog({
  comparisons,
  isLoading,
  error,
  onRetry,
  onClose,
  contestImageUrl,
  contestTitle,
}: {
  comparisons: import('@/features/comparison/types').PublicContestComparison[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  onClose: () => void
  contestImageUrl: string
  contestTitle: string
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('hidden'))
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      const returnFocusTarget = returnFocusRef.current
      window.requestAnimationFrame(() => returnFocusTarget?.focus())
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 sm:p-6" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-comparison-dialog-title"
        tabIndex={-1}
        className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-background p-5 shadow-2xl outline-none sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">사진 비교</p>
            <h2 id="public-comparison-dialog-title" className="text-lg font-semibold">이 작품과 비교한 사진</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="이 작품과 비교한 사진 닫기" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <PublicContestComparisonGallery
          comparisons={comparisons}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          contestImageUrl={contestImageUrl}
          contestTitle={contestTitle}
          compact
        />
      </div>
    </div>
  )
}

// 집중률 섹션: 지원하지 않거나 매칭 실패(204→null)해도 제공 불가 안내를 표시한다.
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
  if (!forecast) {
    return (
      <Section title="방문 타이밍">
        <CrowdUnavailableNotice />
      </Section>
    )
  }

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
