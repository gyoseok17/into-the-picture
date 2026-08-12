import type { ContestSummary } from '@/features/contest/types'

export interface UserPhoto { id: number; url: string; originalFilename: string | null; contentType: string | null; fileSize: number | null; takenAt: string | null; memo: string | null; createdAt: string }
export interface PhotoComparison { id: number; userPhoto: UserPhoto; contest: ContestSummary; createdAt: string }
