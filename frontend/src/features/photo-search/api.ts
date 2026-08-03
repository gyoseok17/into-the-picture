import { apiClient } from '@/lib/apiClient'
import type { Page } from '@/lib/api-types'
import type { Photo } from './types'

export async function fetchPhotos(keyword: string, page: number): Promise<Page<Photo>> {
  const { data } = await apiClient.get<Page<Photo>>('/photos', { params: { keyword: keyword || undefined, page, size: 20 } })
  return data
}
