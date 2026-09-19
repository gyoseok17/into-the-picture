import { Pencil, Trophy } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PhotoComparisonBadge } from '@/features/comparison/components/PhotoComparisonLinks'
import type { PhotoComparison } from '@/features/comparison/types'

import { formatDate, formatTakenAt, UNKNOWN_DATE, UNKNOWN_PLACE } from '../lib/photoRecordAlbumPresentation'
import type { PhotoRecordBundle } from '../types'

export function PhotoRecordBundleCard({
  bundle,
  updating,
  selecting,
  selected,
  onSelect,
  onEdit,
  onOpen,
  comparisonsByPhotoId,
  storyOnly = false,
}: {
  bundle: PhotoRecordBundle
  updating: boolean
  selecting: boolean
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onOpen?: () => void
  comparisonsByPhotoId: Map<number, PhotoComparison[]>
  storyOnly?: boolean
}) {
  const record = bundle.photos[0]
  const bundleComparisons = bundle.photos.flatMap((photo) => comparisonsByPhotoId.get(photo.id) ?? [])
  if (!record) return null

  if (storyOnly) {
    return (
      <Card onClick={(event) => { if (!selecting && !(event.target as HTMLElement).closest('button, input, label')) onOpen?.() }} className={`group relative overflow-hidden rounded-none border-0 bg-transparent shadow-none ${selected ? 'ring-2 ring-primary' : ''} ${onOpen && !selecting ? 'cursor-pointer' : ''}`}>
        {selecting ? <label className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/95 shadow"><input type="checkbox" checked={selected} onChange={onSelect} aria-label={`${record.placeName || '사진 기록'} 선택`} /></label> : null}
        <div className="bg-[#edf0ed] p-2"><AspectImage src={record.url} alt={record.originalFilename ?? '여행 사진'} ratioClassName="aspect-[4/3]" /></div>
        <div className="font-handwritten min-h-16 bg-white px-4 py-3">
          {record.placeName ? <p className="line-clamp-1 text-base font-medium text-foreground">{record.placeName}</p> : null}
          {record.memo ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{record.memo}</p> : null}
        </div>
      </Card>
    )
  }

  return (
    <Card onClick={(event) => { if (!selecting && !(event.target as HTMLElement).closest('button, input, label')) onOpen?.() }} className={`group relative overflow-hidden ${selected ? 'ring-2 ring-primary' : ''} ${onOpen && !selecting ? 'cursor-pointer' : ''}`}>
      {selecting ? <label className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/95 shadow"><input type="checkbox" checked={selected} onChange={onSelect} aria-label={`${record.placeName || '사진 기록'} 선택`} /></label> : null}
      <AspectImage src={record.url} alt={record.originalFilename ?? '내 사진'} ratioClassName="aspect-[4/3]" />
      <div className="space-y-2 p-3">
        <PhotoComparisonBadge comparisons={bundleComparisons} />
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-medium">{record.placeName || UNKNOWN_PLACE}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatTakenAt(record.takenAt) ?? `${UNKNOWN_DATE} · 업로드 ${formatDate(record.createdAt)}`}</p>
        </div>
        {record.memo ? <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{record.memo}</p> : null}
        {!bundle.legacy && bundle.photos.length > 1 ? <p className="text-xs font-medium text-primary">사진 {bundle.photos.length}장</p> : null}
        {record.contestId ? <p className="text-xs text-muted-foreground">{record.displayMode === 'PHOTO_ONLY' ? '내 사진만 보기' : '수상작과 함께 보기'}</p> : null}
        {!selecting ? (
          <div className="flex items-center justify-between gap-1 border-t pt-2">
            {bundle.legacy ? <Button size="sm" variant="ghost" onClick={onEdit} disabled={updating}><Pencil className="h-3.5 w-3.5" />수정</Button> : <span className="px-2 text-xs text-muted-foreground">묶음 기록</span>}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function StoryComparisonMarker({ connectedPhotoCount }: { connectedPhotoCount: number }) {
  if (!connectedPhotoCount) return null
  return (
    <span className="absolute -left-5 -top-5 z-20 inline-flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full border border-white/80 bg-primary px-1 text-primary-foreground shadow-sm">
      <Trophy className="h-3.5 w-3.5" aria-hidden />
      <span className="text-[10px] font-semibold leading-none">{connectedPhotoCount}</span>
      <span className="sr-only">비교 연결된 사진 {connectedPhotoCount}장</span>
    </span>
  )
}
