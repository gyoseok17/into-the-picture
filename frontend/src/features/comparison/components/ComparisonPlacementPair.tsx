import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { getComparisonPhotoDisplay } from '../lib/comparisonPhotoDisplay'
import type { PhotoComparison } from '../types'
import { ComparisonContestCropImage, ComparisonCropImage } from './ComparisonCropImage'

/** The comparison-result detail board; management uses the joined card pair. */
export function ComparisonPlacementPair({
  comparison,
  showDesktopDirection = true,
}: {
  comparison: PhotoComparison
  /** Inline result dialogs already group the two images, so omit their desktop arrow. */
  showDesktopDirection?: boolean
}) {
  const photoDisplay = getComparisonPhotoDisplay(comparison.userPhoto)

  if (comparison.displayMode === 'PHOTO_ONLY') {
    return <AspectImage src={comparison.userPhoto.url} alt={comparison.userPhoto.originalFilename ?? '내 사진'} />
  }

  return (
    <div className={`grid min-w-0 gap-0 md:items-center ${showDesktopDirection ? 'md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'md:grid-cols-2'}`}>
      <ComparisonPlacementPreview label="수상작" title={comparison.contest.title}>
        <ComparisonContestCropImage
          src={comparison.contest.thumbUrl}
          alt={comparison.contest.title}
          crop={comparison.crop}
          className="rounded-lg"
        />
      </ComparisonPlacementPreview>
      {showDesktopDirection ? <ArrowRight className="m-auto hidden h-5 w-5 text-muted-foreground md:block" aria-hidden /> : null}
      <ComparisonPlacementPreview label="내 사진" title={photoDisplay.title} subtitle={photoDisplay.subtitle}>
        <ComparisonCropImage
          src={comparison.userPhoto.url}
          alt={comparison.userPhoto.originalFilename ?? '내 사진'}
          crop={comparison.crop}
          className="rounded-lg"
        />
      </ComparisonPlacementPreview>
    </div>
  )
}

function ComparisonPlacementPreview({ label, title, subtitle, children }: { label: string; title: string; subtitle?: string | null; children: ReactNode }) {
  return (
    <article className="min-w-0 space-y-2 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
      <p className="line-clamp-1 text-sm font-medium">{title}</p>
      {subtitle ? <p className="-mt-1 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </article>
  )
}
