import { apiClient } from '@/lib/apiClient'
import type { ComparisonCrop, ComparisonVisibility, PhotoComparison, PublicContestComparison, UserPhoto } from './types'
export async function fetchUserPhotos(): Promise<UserPhoto[]> { const { data } = await apiClient.get<UserPhoto[]>('/me/photos'); return data }
export async function deleteUserPhoto(id: number): Promise<void> { await apiClient.delete(`/me/photos/${id}`) }
export async function fetchComparisons(): Promise<PhotoComparison[]> { const { data } = await apiClient.get<PhotoComparison[]>('/me/comparisons'); return data }
export async function fetchPublicContestComparisons(contestId: number): Promise<PublicContestComparison[]> {
  const { data } = await apiClient.get<PublicContestComparison[]>(`/contests/${contestId}/comparisons`)
  return data
}
export async function createComparison(userPhotoId: number, contestId: number, crop: ComparisonCrop): Promise<PhotoComparison> { const { data } = await apiClient.post<PhotoComparison>('/me/comparisons', { userPhotoId, contestId, crop }); return data }
export async function deleteComparison(id: number, deletePhoto: boolean): Promise<void> { await apiClient.delete(`/me/comparisons/${id}`, { params: { deletePhoto } }) }
export async function updateComparisonVisibility(id: number, visibility: ComparisonVisibility): Promise<PhotoComparison> {
  const { data } = await apiClient.patch<PhotoComparison>(`/me/comparisons/${id}/visibility`, { visibility })
  return data
}
