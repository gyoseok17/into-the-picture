import { apiClient } from '@/lib/apiClient'
import type { FavoriteContest, FavoriteStatus } from './types'

export async function fetchContestFavoriteStatus(contestId: number): Promise<FavoriteStatus> {
  const { data } = await apiClient.get<FavoriteStatus>(`/me/favorites/contests/${contestId}`)
  return data
}

export async function addContestFavorite(contestId: number): Promise<FavoriteStatus> {
  const { data } = await apiClient.post<FavoriteStatus>(`/me/favorites/contests/${contestId}`)
  return data
}

export async function removeContestFavorite(contestId: number): Promise<void> {
  await apiClient.delete(`/me/favorites/contests/${contestId}`)
}

export async function fetchFavoriteContests(): Promise<FavoriteContest[]> {
  const { data } = await apiClient.get<FavoriteContest[]>('/me/favorites/contests')
  return data
}
