import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'

import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhotoAlbumGrid, groupPhotoPage } from '@/features/photo-search/components/PhotoAlbums'
import { usePhotos } from '@/features/photo-search/hooks/usePhotos'

export default function ExplorePage() {
  const [draft, setDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const query = usePhotos(keyword)
  const albums = useMemo(() => query.data?.pages.flatMap((page, pageIndex) =>
    groupPhotoPage(page.content).map((album) => ({ ...album, key: `${pageIndex}:${album.key}` })),
  ) ?? [], [query.data])
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node || !query.hasNextPage) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage()
    }, { rootMargin: '240px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setKeyword(draft.trim())
  }

  return (
    <section className="space-y-5">
      <header className="space-y-1"><h1 className="text-xl font-semibold">키워드 검색</h1><p className="text-sm text-muted-foreground">키워드로 전국 관광사진을 찾아보세요.</p></header>
      <form onSubmit={submit} className="flex gap-2"><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="예: 단풍, 바다, 야경" aria-label="관광사진 검색" /><Button type="submit"><Search className="mr-1 h-4 w-4" />검색</Button></form>
      {keyword ? <p className="text-sm text-muted-foreground"><b className="text-foreground">{keyword}</b> 검색 결과 <button type="button" className="ml-2 underline" onClick={() => { setDraft(''); setKeyword('') }}>전체 보기</button></p> : <p className="text-sm text-muted-foreground">최신 관광사진</p>}
      {query.isPending ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />)}</div> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : null}
      {!query.isPending && !query.isError && albums.length === 0 ? <EmptyState title="사진을 찾지 못했어요" description="다른 키워드로 다시 검색해 보세요." /> : null}
      {albums.length > 0 ? <><PhotoAlbumGrid albums={albums} onSearch={(nextKeyword) => { setDraft(nextKeyword); setKeyword(nextKeyword) }} /><div ref={sentinel} className="h-8" />{query.isFetchingNextPage ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : null}</> : null}
    </section>
  )
}
