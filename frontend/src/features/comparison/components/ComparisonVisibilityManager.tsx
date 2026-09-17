import { Eye, EyeOff } from 'lucide-react'

import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Button } from '@/components/ui/button'
import { ComparisonJoinedThumbnailPair } from './ComparisonJoinedThumbnailPair'
import { useUpdateComparisonVisibility } from '../hooks/useComparison'
import type { PhotoComparison } from '../types'

interface ComparisonVisibilityManagerProps {
  comparisons: PhotoComparison[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

/** Shows only the sharing decision for each saved contest comparison. */
export function ComparisonVisibilityManager({
  comparisons,
  isLoading,
  error,
  onRetry,
}: ComparisonVisibilityManagerProps) {
  if (isLoading) return <LoadingState label="비교한 사진을 불러오는 중이에요." />
  if (error) return <ErrorState error={error} onRetry={onRetry} />

  if (!comparisons.length) {
    return (
      <EmptyState
        title="아직 관리할 비교 사진이 없어요."
        description="수상작에 내 사진을 놓으면 여기에서 공개 여부를 관리할 수 있어요."
      />
    )
  }

  return (
    <ul className="space-y-6">
      {comparisons.map((comparison) => (
        <ComparisonVisibilityItem key={comparison.id} comparison={comparison} />
      ))}
    </ul>
  )
}

function ComparisonVisibilityItem({ comparison }: { comparison: PhotoComparison }) {
  const updateVisibility = useUpdateComparisonVisibility()
  const isPublic = comparison.visibility === 'PUBLIC'
  const nextVisibility = isPublic ? 'PRIVATE' : 'PUBLIC'

  function toggle(): void {
    updateVisibility.mutate({ id: comparison.id, visibility: nextVisibility })
  }

  return (
    <li className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <ComparisonJoinedThumbnailPair comparison={comparison} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold">{comparison.contest.title}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{comparison.contest.location?.trim() || '장소 정보 없음'}</p>
        </div>
        <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                isPublic ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isPublic ? <Eye className="h-3.5 w-3.5" aria-hidden /> : <EyeOff className="h-3.5 w-3.5" aria-hidden />}
              {isPublic ? '공개 중' : '비공개'}
            </span>
            <Button
              type="button"
              size="sm"
              variant={isPublic ? 'outline' : 'default'}
              disabled={updateVisibility.isPending}
              onClick={toggle}
              aria-label={isPublic ? `${comparison.contest.title} 비교 사진을 비공개로 변경` : `${comparison.contest.title} 비교 사진을 공개로 변경`}
            >
              {updateVisibility.isPending ? '변경 중…' : isPublic ? '비공개' : '공개'}
            </Button>
        </div>
      </div>
      {updateVisibility.isError ? (
        <p role="alert" aria-live="assertive" className="border-t border-border/70 px-4 pb-4 text-xs text-destructive sm:px-5 sm:pb-5">
          상태를 바꾸지 못했어요. 다시 시도해 주세요.
        </p>
      ) : null}
    </li>
  )
}
