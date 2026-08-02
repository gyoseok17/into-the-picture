import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { List, Loader2, Map } from 'lucide-react'

import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useContests } from '../hooks/useContests'
import { useContestMap } from '../hooks/useContestMap'
import { useContestFilters } from '../hooks/useContestFilters'
import { ContestFilterBar } from '../components/ContestFilterBar'
import { ContestGrid } from '../components/ContestGrid'
import { ContestCard, ContestCardSkeleton } from '../components/ContestCard'
import { ContestMapView } from '../components/ContestMapView'
import type { ContestQuery, FilterOptions } from '../types'

// 필터 옵션 로드 실패 시 graceful 강등(키워드 검색만 동작).
const EMPTY_FILTER_OPTIONS: FilterOptions = {
  seasons: [],
  grades: [],
  divisions: [],
  sidos: [],
}

type ViewMode = 'list' | 'map'

export default function ContestListPage() {
  const [query, setQuery] = useState<ContestQuery>({})
  // 리스트/지도 두 뷰는 같은 필터 상태(query)를 공유한다.
  const [view, setView] = useState<ViewMode>('list')

  const filtersQuery = useContestFilters()
  const filterOptions =
    filtersQuery.data ?? (filtersQuery.isError ? EMPTY_FILTER_OPTIONS : undefined)

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">수상작</h1>
          <p className="text-sm text-muted-foreground">
            전국 관광사진 공모전 수상작을 둘러보세요.
          </p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </header>

      <ContestFilterBar
        value={query}
        options={filterOptions}
        onChange={setQuery}
      />

      {view === 'list' ? (
        <ListView query={query} />
      ) : (
        <MapView query={query} />
      )}
    </section>
  )
}

// 리스트/지도 세그먼트 토글.
function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (next: ViewMode) => void
}) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border p-0.5">
      <ToggleButton active={value === 'list'} onClick={() => onChange('list')}>
        <List className="h-4 w-4" /> 리스트
      </ToggleButton>
      <ToggleButton active={value === 'map'} onClick={() => onChange('map')}>
        <Map className="h-4 w-4" /> 지도
      </ToggleButton>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

// 리스트 뷰: 무한스크롤 그리드(기존 동작 그대로).
function ListView({ query }: { query: ContestQuery }) {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContests(query)

  const contests = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  )

  // 무한스크롤: 화면 하단 센티넬이 보이면 다음 페이지 요청.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isPending) {
    return (
      <ContestGrid>
        {Array.from({ length: 8 }).map((_, index) => (
          <ContestCardSkeleton key={index} />
        ))}
      </ContestGrid>
    )
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />
  }

  if (contests.length === 0) {
    return (
      <EmptyState
        title="조건에 맞는 수상작이 없어요"
        description="필터를 바꾸거나 초기화해보세요."
      />
    )
  }

  return (
    <>
      <ContestGrid>
        {contests.map((contest) => (
          <ContestCard key={contest.id} contest={contest} />
        ))}
      </ContestGrid>

      <div ref={sentinelRef} aria-hidden className="h-8" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}
    </>
  )
}

// 지도 뷰: 필터 걸린 작품 전체를 한 번에 받아 다중 마커로.
function MapView({ query }: { query: ContestQuery }) {
  const { data, isPending, isError, error, refetch } = useContestMap(
    query,
    true,
  )

  if (isPending) {
    return <Skeleton className="aspect-[3/4] w-full rounded-lg sm:aspect-[16/10]" />
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />
  }

  return <ContestMapView pins={data} />
}
