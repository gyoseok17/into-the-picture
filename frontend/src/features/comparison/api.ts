import { apiClient } from '@/lib/apiClient'
import type { PhotoComparison, UserPhoto } from './types'
export async function fetchUserPhotos(): Promise<UserPhoto[]> { const { data } = await apiClient.get<UserPhoto[]>('/me/photos'); return data }
export async function uploadUserPhoto(file: File): Promise<UserPhoto> { const body = new FormData(); body.append('file', file); const { data } = await apiClient.post<UserPhoto>('/me/photos', body, { headers: { 'Content-Type': 'multipart/form-data' } }); return data }
export async function deleteUserPhoto(id: number): Promise<void> { await apiClient.delete(`/me/photos/${id}`) }
export async function fetchComparisons(): Promise<PhotoComparison[]> { const { data } = await apiClient.get<PhotoComparison[]>('/me/comparisons'); return data }
export async function createComparison(userPhotoId: number, contestId: number): Promise<PhotoComparison> { const { data } = await apiClient.post<PhotoComparison>('/me/comparisons', { userPhotoId, contestId }); return data }
export async function deleteComparison(id: number, deletePhoto: boolean): Promise<void> { await apiClient.delete(`/me/comparisons/${id}`, { params: { deletePhoto } }) }
export async function replaceComparisonPhoto(id: number, userPhotoId: number): Promise<PhotoComparison> { const { data } = await apiClient.patch<PhotoComparison>(`/me/comparisons/${id}`, { userPhotoId }); return data }
