import type { ContestSummary } from '@/features/contest/types'

export interface FavoriteStatus { favorite: boolean }

export interface FavoriteContest {
  favoriteId: number
  contestId: number
  contest: ContestSummary
  createdAt: string
}
