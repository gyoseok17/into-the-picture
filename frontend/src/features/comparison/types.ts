import type { ContestSummary } from '@/features/contest/types'
import type { PhotoDisplayMode } from '@/features/photo-record/types'

export interface UserPhoto { id: number; url: string; originalFilename: string | null; contentType: string | null; fileSize: number | null; takenAt: string | null; placeName: string | null; memo: string | null; createdAt: string }
export type ComparisonVisibility = 'PUBLIC' | 'PRIVATE'

/** Presentation-only crop for a contest comparison; it never changes the album original. */
export interface ComparisonCrop {
  aspectRatio: number
  zoom: number
  offsetX: number
  offsetY: number
}

export interface PhotoComparison {
  id: number
  userPhoto: UserPhoto
  contest: ContestSummary
  displayMode: PhotoDisplayMode
  crop: ComparisonCrop | null
  visibility: ComparisonVisibility
  createdAt: string
}

/**
 * Public contest comparison deliberately excludes all personal-album metadata.
 * Its image is served from a contest-scoped public endpoint, never `/me/photos`.
 */
export interface PublicContestComparison {
  id: number
  photoUrl: string
  crop: ComparisonCrop | null
  createdAt: string
}
