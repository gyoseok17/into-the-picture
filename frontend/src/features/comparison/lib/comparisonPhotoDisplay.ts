/**
 * Comparison surfaces identify an album photo by its travel context, never by
 * the device filename. File names remain available for file metadata and alt text.
 */
export interface ComparisonPhotoDisplaySource {
  placeName: string | null | undefined
  takenAt: string | null | undefined
}

export interface ComparisonPhotoDisplay {
  title: string
  subtitle: string | null
}

export function getComparisonPhotoDisplay(photo: ComparisonPhotoDisplaySource): ComparisonPhotoDisplay {
  const placeName = photo.placeName?.trim() || null
  const takenAt = formatComparisonPhotoDate(photo.takenAt)

  return {
    title: placeName ?? takenAt ?? '내 사진',
    subtitle: placeName ? takenAt : null,
  }
}

export function formatComparisonPhotoDate(value: string | null | undefined): string | null {
  const datePart = value?.slice(0, 10)
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null

  const [year, month, day] = datePart.split('-')
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}
