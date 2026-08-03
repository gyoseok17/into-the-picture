import { useEffect, useMemo, useRef, useState } from 'react'
import { Images, Loader2, Search, X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePhotos } from '@/features/photo-search/hooks/usePhotos'
import type { Photo } from '@/features/photo-search/types'

interface PhotoAlbum {
  key: string
  title: string
  location: string | null
  cover: Photo
  photos: Photo[]
}

function groupPage(photos: Photo[]): PhotoAlbum[] {
  const albums = new Map<string, PhotoAlbum>()
  for (const photo of photos) {
    const key = `${photo.title}\u0000${photo.location ?? ''}`
    const album = albums.get(key)
    if (album) album.photos.push(photo)
    else albums.set(key, { key, title: photo.title, location: photo.location, cover: photo, photos: [photo] })
  }
  return [...albums.values()]
}

export default function ExplorePage() {
  const [draft, setDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<PhotoAlbum | null>(null)
  const query = usePhotos(keyword)
  const albums = useMemo(() => query.data?.pages.flatMap((page, pageIndex) =>
    groupPage(page.content).map((album) => ({ ...album, key: `${pageIndex}:${album.key}` })),
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
    setSelected(null)
  }

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">키워드 검색</h1>
        <p className="text-sm text-muted-foreground">키워드로 전국 관광사진을 찾아보세요.</p>
      </header>
      <form onSubmit={submit} className="flex gap-2">
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="예: 단풍, 바다, 야경" aria-label="관광사진 검색" />
        <Button type="submit"><Search className="mr-1 h-4 w-4" />검색</Button>
      </form>
      {keyword ? <p className="text-sm text-muted-foreground"><b className="text-foreground">{keyword}</b> 검색 결과 <button type="button" className="ml-2 underline" onClick={() => { setDraft(''); setKeyword('') }}>전체 보기</button></p> : <p className="text-sm text-muted-foreground">최신 관광사진</p>}
      {query.isPending ? <AlbumGrid>{Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />)}</AlbumGrid> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : null}
      {!query.isPending && !query.isError && albums.length === 0 ? <EmptyState title="사진을 찾지 못했어요" description="다른 키워드로 다시 검색해 보세요." /> : null}
      {albums.length > 0 ? <><AlbumGrid>{albums.map((album) => <AlbumCard key={album.key} album={album} onClick={() => setSelected(album)} />)}</AlbumGrid><div ref={sentinel} className="h-8" />{query.isFetchingNextPage ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : null}</> : null}
      {selected ? <AlbumDetail album={selected} onClose={() => setSelected(null)} onSearch={(nextKeyword) => { setDraft(nextKeyword); setKeyword(nextKeyword); setSelected(null) }} /> : null}
    </section>
  )
}

function AlbumGrid({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div> }
function AlbumCard({ album, onClick }: { album: PhotoAlbum; onClick: () => void }) { return <button type="button" onClick={onClick} className="text-left"><Card className="h-full overflow-hidden transition-shadow hover:shadow-md"><AspectImage src={album.cover.imageUrl ?? ''} alt={album.title} /><div className="space-y-1 p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Images className="h-3.5 w-3.5" />사진 {album.photos.length}장</div><h2 className="line-clamp-1 text-sm font-semibold">{album.title}</h2><p className="line-clamp-1 text-xs text-muted-foreground">{album.location ?? '촬영지 정보 없음'}</p></div></Card></button> }
function AlbumDetail({ album, onClose, onSearch }: { album: PhotoAlbum; onClose: () => void; onSearch: (keyword: string) => void }) { const keywords = [...new Set(album.photos.flatMap((photo) => photo.keywords))]; const multiplePhotos = album.photos.length > 1; return <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center" onClick={onClose}><Card className="max-h-[90vh] w-full max-w-3xl overflow-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between p-4"><div><h2 className="font-semibold">{album.title}</h2><p className="text-sm text-muted-foreground">촬영지: {album.location ?? '정보 없음'} · 사진 {album.photos.length}장</p></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>{keywords.length > 0 ? <div className="space-y-2 px-4 pb-4"><p className="text-sm font-medium">관련 키워드</p><div className="flex flex-wrap gap-1.5">{keywords.map((keyword) => <button key={keyword} type="button" onClick={() => onSearch(keyword)} className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/70">{keyword}</button>)}</div></div> : null}<div className={`grid grid-cols-1 gap-3 p-4 pt-0 ${multiplePhotos ? 'sm:grid-cols-2' : ''}`}>{album.photos.map((photo) => <div key={photo.id} className={multiplePhotos ? 'space-y-2' : 'mx-auto w-full max-w-xl space-y-2'}><AspectImage src={photo.imageUrl ?? ''} alt={photo.title} /><p className="text-xs text-muted-foreground">{photo.photographer ?? '촬영자 정보 없음'} · {photo.filmMonth ?? '촬영월 정보 없음'}</p></div>)}</div></Card></div> }
