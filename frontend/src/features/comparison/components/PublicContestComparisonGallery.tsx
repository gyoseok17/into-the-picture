import { useEffect, useState, type ReactNode } from 'react'
import { Check, UsersRound } from 'lucide-react'

import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { API_BASE } from '@/lib/env'
import type { PublicContestComparison } from '../types'
import { ComparisonContestCropImage, ComparisonCropImage } from './ComparisonCropImage'

interface PublicContestComparisonGalleryProps {
  comparisons: PublicContestComparison[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  contestImageUrl?: string
  contestTitle?: string
  compact?: boolean
}

/** Public-only gallery. It deliberately keeps the main comparison board fixed and scrolls only the selector. */
export function PublicContestComparisonGallery({
  comparisons,
  isLoading,
  error,
  onRetry,
  contestImageUrl,
  contestTitle = '수상작 원본',
  compact = false,
}: PublicContestComparisonGalleryProps) {
  const [selectedComparisonId, setSelectedComparisonId] = useState<number | null>(null)
  const selectedComparison = comparisons.find((comparison) => comparison.id === selectedComparisonId) ?? comparisons[0]

  useEffect(() => {
    if (comparisons.length === 0) {
      setSelectedComparisonId(null)
      return
    }
    if (!comparisons.some((comparison) => comparison.id === selectedComparisonId)) {
      setSelectedComparisonId(comparisons[0].id)
    }
  }, [comparisons, selectedComparisonId])

  return (
    <section className="space-y-3" aria-labelledby={compact ? undefined : 'public-comparison-heading'}>
      {!compact ? (
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" aria-hidden />
          <div>
            <h2 id="public-comparison-heading" className="text-base font-semibold">이 작품과 비교한 사진</h2>
            <p className="text-xs text-muted-foreground">공개를 선택한 여행자의 장면이에요.</p>
          </div>
        </div>
      ) : null}

      {isLoading ? <LoadingState label="이 작품과 비교한 사진을 불러오는 중이에요." /> : null}
      {!isLoading && error ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && comparisons.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
          아직 이 작품과 비교한 공개 사진이 없어요.
        </p>
      ) : null}
      {!isLoading && !error && comparisons.length > 0 && selectedComparison ? (
        <div className="space-y-4">
          {contestImageUrl ? (
            <section aria-label="수상작과 선택한 공개 사진 비교" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="grid grid-cols-2 divide-x">
                <ComparisonPanel label="수상작 원본">
                  <ComparisonContestCropImage
                    src={contestImageUrl}
                    alt={contestTitle}
                    crop={selectedComparison.crop}
                    className="bg-muted/40"
                  />
                </ComparisonPanel>
                <ComparisonPanel label="선택한 공개 사진">
                  <ComparisonCropImage
                    src={resolvePublicComparisonImageUrl(selectedComparison.photoUrl)}
                    alt="수상작과 비교한 공개 사진"
                    crop={selectedComparison.crop}
                  />
                </ComparisonPanel>
              </div>
            </section>
          ) : null}

          <section aria-label="공개 비교 사진 선택" className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">공개 비교 사진</p>
              <p className="text-xs text-muted-foreground">{comparisons.length}장</p>
            </div>
            <div className="max-h-52 overflow-y-auto pr-1" aria-label="공개 비교 사진 목록">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {comparisons.map((comparison, index) => {
                  const isSelected = comparison.id === selectedComparison.id
                  return (
                    <button
                      key={comparison.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${index + 1}번째 공개 비교 사진${isSelected ? ', 선택됨' : ''}`}
                      onClick={() => setSelectedComparisonId(comparison.id)}
                      className={`relative overflow-hidden rounded-xl border bg-card text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'hover:border-primary/60'
                      }`}
                    >
                      <ComparisonCropImage
                        src={resolvePublicComparisonImageUrl(comparison.photoUrl)}
                        alt=""
                        crop={comparison.crop}
                        className="aspect-square"
                      />
                      {isSelected ? (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function ComparisonPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function resolvePublicComparisonImageUrl(photoUrl: string): string {
  if (/^https?:\/\//.test(photoUrl)) return photoUrl
  if (/^https?:\/\//.test(API_BASE)) {
    const apiUrl = new URL(API_BASE)
    if (photoUrl.startsWith('/api/')) return new URL(photoUrl, apiUrl.origin).toString()
    return new URL(photoUrl.replace(/^\//, ''), `${API_BASE.replace(/\/$/, '')}/`).toString()
  }
  if (photoUrl.startsWith('/api/')) return photoUrl
  return `${API_BASE.replace(/\/$/, '')}/${photoUrl.replace(/^\//, '')}`
}
