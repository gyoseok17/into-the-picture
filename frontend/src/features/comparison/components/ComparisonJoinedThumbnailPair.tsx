import { AspectImage } from '@/components/AspectImage'
import type { PhotoComparison } from '../types'

/** Exact M6 comparison result-card top, used for scan-friendly management. */
export function ComparisonJoinedThumbnailPair({ comparison }: { comparison: PhotoComparison }) {
  if (comparison.displayMode === 'PHOTO_ONLY') {
    return <AspectImage src={comparison.userPhoto.url} alt={comparison.userPhoto.originalFilename ?? '내 사진'} />
  }

  return (
    <div className="grid grid-cols-2">
      <AspectImage src={comparison.contest.thumbUrl} alt={comparison.contest.title} />
      <AspectImage src={comparison.userPhoto.url} alt={comparison.userPhoto.originalFilename ?? '내 사진'} />
    </div>
  )
}
