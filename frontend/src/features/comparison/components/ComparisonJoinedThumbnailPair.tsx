import { AspectImage } from '@/components/AspectImage'
import type { PhotoComparison } from '../types'
import { ComparisonContestCropImage, ComparisonCropImage } from './ComparisonCropImage'

/** Exact M6 comparison result-card top, used for scan-friendly management. */
export function ComparisonJoinedThumbnailPair({ comparison }: { comparison: PhotoComparison }) {
  if (comparison.displayMode === 'PHOTO_ONLY') {
    return <AspectImage src={comparison.userPhoto.url} alt={comparison.userPhoto.originalFilename ?? '내 사진'} />
  }

  return (
    <div className="grid grid-cols-2">
      <ComparisonContestCropImage
        src={comparison.contest.thumbUrl}
        alt={comparison.contest.title}
        crop={comparison.crop}
      />
      <ComparisonCropImage
        src={comparison.userPhoto.url}
        alt={comparison.userPhoto.originalFilename ?? '내 사진'}
        crop={comparison.crop}
      />
    </div>
  )
}
