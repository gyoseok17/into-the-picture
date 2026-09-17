import { Check, Eye, Trophy } from 'lucide-react'
import { useRef, useState } from 'react'

import { AspectImage } from '@/components/AspectImage'
import type { PhotoComparison } from '../types'
import { PhotoComparisonResultDialog } from './PhotoComparisonResultDialog'

export function PhotoComparisonBadge({ comparisons }: { comparisons: PhotoComparison[] }) {
  if (!comparisons.length) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
      <Check className="h-3 w-3" />
      비교 연결 {comparisons.length > 1 ? comparisons.length : ''}
    </span>
  )
}

/**
 * 사진 자체에 비교 연결 여부를 표시하고, 현재 화면을 벗어나지 않고
 * 인라인 비교 결과를 여는 아이콘 전용 트리거다.
 */
export function PhotoComparisonTrophyBadge({ comparisons }: { comparisons: PhotoComparison[] }) {
  const [selectedComparisonId, setSelectedComparisonId] = useState<number | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  if (!comparisons.length) return null

  const comparisonCountLabel = comparisons.length > 1 ? ` ${comparisons.length}건` : ''

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setSelectedComparisonId(comparisons[0].id)
        }}
        aria-label={`수상작 비교 결과${comparisonCountLabel} 보기`}
        title={`수상작 비교 결과${comparisonCountLabel} 보기`}
        className="absolute left-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/90 bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Trophy className="h-3.5 w-3.5" aria-hidden />
      </button>
      {selectedComparisonId != null ? <PhotoComparisonResultDialog comparisons={comparisons} initialComparisonId={selectedComparisonId} returnFocusRef={triggerRef} onClose={() => setSelectedComparisonId(null)} /> : null}
    </>
  )
}

export function PhotoComparisonLinks({ comparisons }: { comparisons: PhotoComparison[] }) {
  const [selectedComparisonId, setSelectedComparisonId] = useState<number | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  if (!comparisons.length) return null

  return (
    <section className="mt-4 border-t pt-4">
      <p className="text-xs font-medium text-muted-foreground">연결된 수상작</p>
      <div className="mt-2 space-y-2">
        {comparisons.map((comparison) => (
          <button
            key={comparison.id}
            ref={comparison.id === selectedComparisonId ? triggerRef : undefined}
            type="button"
            onClick={() => setSelectedComparisonId(comparison.id)}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
          >
            <span className="min-w-0 truncate">{comparison.contest.title}</span>
            <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
      {selectedComparisonId != null ? <PhotoComparisonResultDialog comparisons={comparisons} initialComparisonId={selectedComparisonId} returnFocusRef={triggerRef} onClose={() => setSelectedComparisonId(null)} /> : null}
    </section>
  )
}

/**
 * Expanded album photos keep their image area clear. The representative contest
 * is shown below the image and the existing result dialog handles additional
 * linked contests without navigating away from the album.
 */
export function PhotoComparisonLightboxInfo({ comparisons }: { comparisons: PhotoComparison[] }) {
  const [selectedComparisonId, setSelectedComparisonId] = useState<number | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const comparison = comparisons[0]
  if (!comparison) return null

  return (
    <>
      <section className="mt-3 flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5" aria-label="연결된 수상작">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Trophy className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{comparison.contest.title}</p>
          {comparison.contest.location ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{comparison.contest.location}</p> : null}
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setSelectedComparisonId(comparison.id)}
          aria-label={`${comparison.contest.title} 수상작 사진으로 비교 열기${comparisons.length > 1 ? `, ${comparisons.length}건 연결됨` : ''}`}
          title="수상작 비교 열기"
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-primary/25 bg-background shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AspectImage src={comparison.contest.thumbUrl} alt="" ratioClassName="aspect-square" className="h-full w-full" />
          {comparisons.length > 1 ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">{comparisons.length}</span> : null}
        </button>
      </section>
      {selectedComparisonId != null ? <PhotoComparisonResultDialog comparisons={comparisons} initialComparisonId={selectedComparisonId} returnFocusRef={triggerRef} onClose={() => setSelectedComparisonId(null)} /> : null}
    </>
  )
}
