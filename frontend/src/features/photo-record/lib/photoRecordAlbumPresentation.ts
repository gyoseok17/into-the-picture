import { formatPhotoVisitPeriod } from './formatPhotoVisitPeriod'
import type { PhotoRecordBundle, PhotoRecordDraft, PhotoRecordSort } from '../types'

export type AlbumView = 'active' | 'archive'
export type AlbumLayout = 'story' | 'map'

export const UNKNOWN_DATE = '촬영일 미상'
export const UNKNOWN_PLACE = '장소 미상'

export function storyCardPlacement(index: number) {
  switch (index % 4) {
    case 0:
      return '-translate-x-5 -rotate-[2.4deg] sm:-translate-x-24 sm:-rotate-[3.8deg]'
    case 1:
      return 'translate-x-5 translate-y-1 rotate-[3.2deg] sm:translate-x-24 sm:translate-y-5 sm:rotate-[4.7deg]'
    case 2:
      return '-translate-x-4 translate-y-2 rotate-[2deg] sm:-translate-x-12 sm:translate-y-2 sm:rotate-[3.5deg]'
    default:
      return 'translate-x-4 -translate-y-1 -rotate-[2.8deg] sm:translate-x-14 sm:translate-y-3 sm:-rotate-[4.2deg]'
  }
}

export function bundleKey(bundle: PhotoRecordBundle): string {
  return bundle.id
    ? `bundle-${bundle.id}`
    : `legacy-${bundle.photos[0]?.id ?? bundle.createdAt}`
}

export function groupBundles(
  bundles: PhotoRecordBundle[],
  sort: PhotoRecordSort,
): Array<{ key: string; label: string; bundles: PhotoRecordBundle[] }> {
  const ordered = bundles
    .filter((bundle) => bundle.photos.length > 0)
    .sort((left, right) => {
      const leftValue = sort === 'time'
        ? (left.takenAt ?? left.createdAt)
        : left.placeName?.trim() || UNKNOWN_PLACE
      const rightValue = sort === 'time'
        ? (right.takenAt ?? right.createdAt)
        : right.placeName?.trim() || UNKNOWN_PLACE

      return sort === 'time'
        ? new Date(rightValue).getTime() - new Date(leftValue).getTime()
        : leftValue.localeCompare(rightValue, 'ko')
    })
  const groups = new Map<string, PhotoRecordBundle[]>()

  for (const bundle of ordered) {
    const key = sort === 'time'
      ? toStoryDayKey(bundle.takenAt ?? bundle.createdAt)
      : bundle.placeName?.trim() || UNKNOWN_PLACE
    groups.set(key, [...(groups.get(key) ?? []), bundle])
  }

  return [...groups.entries()].map(([key, grouped]) => ({
    key,
    label: sort === 'time'
      ? (grouped.length === 1
        ? formatPhotoVisitPeriod(grouped[0].takenAt ?? grouped[0].createdAt, grouped[0].endedAt) ?? formatStoryDay(key)
        : formatStoryDay(key))
      : key,
    bundles: grouped,
  }))
}

export function bulkDeleteResultMessage(deleted: number, conflicts: number, failures: number): string {
  const parts = [`${deleted}개 삭제 완료`]
  if (conflicts) parts.push(`비교에 사용 중인 ${conflicts}개는 유지`)
  if (failures) parts.push(`${failures}개 삭제 실패`)
  return parts.join(' · ')
}

export function normalizeDraft(draft: PhotoRecordDraft): PhotoRecordDraft {
  return {
    takenAt: draft.takenAt || null,
    placeName: draft.placeName?.trim() || null,
    memo: draft.memo?.trim() || null,
  }
}

export function toDateTimeInput(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatTakenAt(value: string | null): string | null {
  return value
    ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))
    : null
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))
}

function toStoryDayKey(value: string): string {
  return value.slice(0, 10)
}

function formatStoryDay(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  )
}
