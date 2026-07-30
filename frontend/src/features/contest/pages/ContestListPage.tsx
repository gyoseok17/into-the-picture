import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { useContests } from '../hooks/useContests'
import { useContestFilters } from '../hooks/useContestFilters'
import { ContestFilterBar } from '../components/ContestFilterBar'
import { ContestGrid } from '../components/ContestGrid'
import { ContestCard, ContestCardSkeleton } from '../components/ContestCard'
import type { ContestQuery, FilterOptions } from '../types'

// 필터 옵션 로드 실패 시 graceful 강등(키워드 검색만 동작).
const EMPTY_FILTER_OPTIONS: FilterOptions = {
  seasons: [],
  grades: [],
  divisions: [],
  sidos: [],
}

export default function ContestListPage() {
  const [query, setQuery] = useState<ContestQuery>({})

  const filtersQuery = useContestFilters()
  const filterOptions =
    filtersQuery.data ?? (filtersQuery.isError ? EMPTY_FILTER_OPTIONS : undefined)

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

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">수상작</h1>
        <p className="text-sm text-muted-foreground">
          전국 관광사진 공모전 수상작을 둘러보세요.
        </p>
      </header>

      <ContestFilterBar
        value={query}
        options={filterOptions}
        onChange={setQuery}
      />

      {isPending ? (
        <ContestGrid>
          {Array.from({ length: 8 }).map((_, index) => (
            <ContestCardSkeleton key={index} />
          ))}
        </ContestGrid>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : contests.length === 0 ? (
        <EmptyState
          title="조건에 맞는 수상작이 없어요"
          description="필터를 바꾸거나 초기화해보세요."
        />
      ) : (
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
      )}
    </section>
  )
}
