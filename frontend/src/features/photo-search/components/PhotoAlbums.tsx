import { useState } from 'react'
import { Images, X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Photo } from '../types'

export interface PhotoAlbum {
  key: string
  title: string
  location: string | null
  cover: Photo
  photos: Photo[]
}

export function groupPhotoPage(photos: Photo[]): PhotoAlbum[] {
  const albums = new Map<string, PhotoAlbum>()
  for (const photo of photos) {
    const key = `${photo.title}\u0000${photo.location ?? ''}`
    const album = albums.get(key)
    if (album) album.photos.push(photo)
    else albums.set(key, { key, title: photo.title, location: photo.location, cover: photo, photos: [photo] })
  }
  return [...albums.values()]
}

export function PhotoAlbumGrid({ albums, onSearch }: { albums: PhotoAlbum[]; onSearch?: (keyword: string) => void }) {
  const [selected, setSelected] = useState<PhotoAlbum | null>(null)

  return <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => <button key={album.key} type="button" onClick={() => setSelected(album)} className="text-left"><Card className="h-full overflow-hidden transition-shadow hover:shadow-md"><AspectImage src={album.cover.imageUrl ?? ''} alt={album.title} /><div className="space-y-1 p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Images className="h-3.5 w-3.5" />사진 {album.photos.length}장</div><h3 className="line-clamp-1 text-sm font-semibold">{album.title}</h3><p className="line-clamp-1 text-xs text-muted-foreground">{album.location ?? '촬영지 정보 없음'}</p></div></Card></button>)}
    </div>
    {selected ? <PhotoAlbumDetail album={selected} onClose={() => setSelected(null)} onSearch={onSearch ? (keyword) => { onSearch(keyword); setSelected(null) } : undefined} /> : null}
  </>
}

function PhotoAlbumDetail({ album, onClose, onSearch }: { album: PhotoAlbum; onClose: () => void; onSearch?: (keyword: string) => void }) {
  const keywords = [...new Set(album.photos.flatMap((photo) => photo.keywords))]
  const multiplePhotos = album.photos.length > 1
  return <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center" onClick={onClose}><Card className="max-h-[90vh] w-full max-w-3xl overflow-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between p-4"><div><h2 className="font-semibold">{album.title}</h2><p className="text-sm text-muted-foreground">촬영지: {album.location ?? '정보 없음'} · 사진 {album.photos.length}장</p></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button></div>{keywords.length > 0 ? <div className="space-y-2 px-4 pb-4"><p className="text-sm font-medium">관련 키워드</p><div className="flex flex-wrap gap-1.5">{keywords.map((keyword) => onSearch ? <button key={keyword} type="button" onClick={() => onSearch(keyword)} className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/70">{keyword}</button> : <span key={keyword} className="rounded-full bg-muted px-2.5 py-1 text-xs">{keyword}</span>)}</div></div> : null}<div className={`grid grid-cols-1 gap-3 p-4 pt-0 ${multiplePhotos ? 'sm:grid-cols-2' : ''}`}>{album.photos.map((photo) => <div key={photo.id} className={multiplePhotos ? 'space-y-2' : 'mx-auto w-full max-w-xl space-y-2'}><AspectImage src={photo.imageUrl ?? ''} alt={photo.title} /><p className="text-xs text-muted-foreground">{photo.photographer ?? '촬영자 정보 없음'} · {photo.filmMonth ?? '촬영월 정보 없음'}</p></div>)}</div></Card></div>
}
