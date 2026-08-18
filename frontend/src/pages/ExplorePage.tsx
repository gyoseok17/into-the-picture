import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollAssist } from '@/components/navigation/ScrollAssist'
import { EditorialSection } from '@/features/home/components/EditorialSection'
import { MobileGridToggle } from '@/features/display-preferences/components/MobileGridToggle'
import { useMobileGridColumns } from '@/features/display-preferences/hooks/useMobileGridColumns'
import { mobileGridClassName } from '@/features/display-preferences/mobileGridClassName'
import { PhotoAlbumGrid, groupPhotoPage, type PhotoAlbum } from '@/features/photo-search/components/PhotoAlbums'
import { usePhotos } from '@/features/photo-search/hooks/usePhotos'

/** 키워드 검색 결과와 무한 스크롤만 담당하는 탐색 화면. */
export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') ?? ''
  const [draft, setDraft] = useState(initialKeyword)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [mobileColumns, setMobileColumns] = useMobileGridColumns()
  const photoQuery = usePhotos(keyword)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const albums = useMemo(
    () => toAlbumsByPage(photoQuery.data?.pages),
    [photoQuery.data],
  )

  useEffect(() => {
    setDraft(initialKeyword)
    setKeyword(initialKeyword)
  }, [initialKeyword])

  useInfinitePhotoScroll({
    sentinelRef,
    hasNextPage: photoQuery.hasNextPage,
    isFetchingNextPage: photoQuery.isFetchingNextPage,
    fetchNextPage: photoQuery.fetchNextPage,
  })

  function applyKeyword(nextKeyword: string): void {
    setDraft(nextKeyword)
    setKeyword(nextKeyword)
    setSearchParams(nextKeyword ? { keyword: nextKeyword } : {})
  }

  function submit(event: React.FormEvent): void {
    event.preventDefault()
    applyKeyword(draft.trim())
  }

  return (
    <div className="space-y-8 pb-8">
      <EditorialSection
        eyebrow="PHOTO SEARCH"
        title="사진으로 여행지 찾아보세요"
        description="키워드로 전국 관광사진을 둘러보고, 같은 제목의 사진은 하나의 앨범으로 확인하세요."
      >
        <form onSubmit={submit} className="flex max-w-xl gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="예: 벚꽃, 바다, 야경"
            aria-label="관광사진 검색"
          />
          <Button type="submit">
            <Search className="mr-1 h-4 w-4" />검색
          </Button>
        </form>
      </EditorialSection>

      <SearchResults
        keyword={keyword}
        albums={albums}
        mobileColumns={mobileColumns}
        onMobileColumnsChange={setMobileColumns}
        onKeywordChange={applyKeyword}
        isPending={photoQuery.isPending}
        isError={photoQuery.isError}
        error={photoQuery.error}
        onRetry={() => void photoQuery.refetch()}
        isFetchingNextPage={photoQuery.isFetchingNextPage}
        sentinelRef={sentinelRef}
      />

      <ScrollAssist action="search">
        {(close) => (
          <InlineQuickSearchPanel
            initialKeyword={keyword}
            onApply={(nextKeyword) => {
              applyKeyword(nextKeyword)
              close()
            }}
          />
        )}
      </ScrollAssist>
    </div>
  )
}

function toAlbumsByPage(pages: Array<{ content: Parameters<typeof groupPhotoPage>[0] }> | undefined): PhotoAlbum[] {
  return pages?.flatMap((page, pageIndex) =>
    groupPhotoPage(page.content).map((album) => ({
      ...album,
      key: `${pageIndex}:${album.key}`,
    })),
  ) ?? []
}

function useInfinitePhotoScroll({
  sentinelRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  sentinelRef: React.RefObject<HTMLDivElement>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}) {
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '240px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, sentinelRef])
}

function SearchResults({
  keyword,
  albums,
  mobileColumns,
  onMobileColumnsChange,
  onKeywordChange,
  isPending,
  isError,
  error,
  onRetry,
  isFetchingNextPage,
  sentinelRef,
}: {
  keyword: string
  albums: PhotoAlbum[]
  mobileColumns: 1 | 2 | 3
  onMobileColumnsChange: (columns: 1 | 2 | 3) => void
  onKeywordChange: (keyword: string) => void
  isPending: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  isFetchingNextPage: boolean
  sentinelRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {keyword ? (
            <><b className="text-foreground">{keyword}</b> 검색 결과</>
          ) : '최신 관광사진'}
        </p>
        <div className="flex items-center gap-2">
          <MobileGridToggle value={mobileColumns} onChange={onMobileColumnsChange} />
          {keyword ? (
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4"
              onClick={() => onKeywordChange('')}
            >
              전체 보기
            </button>
          ) : null}
        </div>
      </div>

      {isPending ? <SearchResultSkeletons mobileColumns={mobileColumns} /> : null}
      {isError ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!isPending && !isError && albums.length === 0 ? (
        <EmptyState
          title="사진을 찾지 못했어요"
          description="다른 키워드로 다시 검색해 보세요."
        />
      ) : null}
      {albums.length > 0 ? (
        <>
          <PhotoAlbumGrid albums={albums} mobileColumns={mobileColumns} onSearch={onKeywordChange} />
          <div ref={sentinelRef} className="h-8" />
          {isFetchingNextPage ? (
            <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function SearchResultSkeletons({ mobileColumns }: { mobileColumns: 1 | 2 | 3 }) {
  return (
    <div className={mobileGridClassName(mobileColumns, 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3')}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  )
}

function InlineQuickSearchPanel({
  initialKeyword,
  onApply,
}: {
  initialKeyword: string
  onApply: (keyword: string) => void
}) {
  const [draft, setDraft] = useState(initialKeyword)

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft.trim())
      }}
    >
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
        placeholder="벚꽃, 바다, 야경"
        aria-label="관광사진 검색어"
      />
      <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" aria-label="검색">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}
