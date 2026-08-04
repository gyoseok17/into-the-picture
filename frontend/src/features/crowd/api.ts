import { apiClient } from '@/lib/apiClient'
import type { ContestSummary } from '@/features/contest/types'
import type { CrowdForecast, CrowdRegion, CrowdSigungu } from './types'

export async function fetchRegions(): Promise<CrowdRegion[]> {
  const { data } = await apiClient.get<CrowdRegion[]>('/crowd/regions')
  return data
}

export async function fetchSigungu(areaCd: string): Promise<CrowdSigungu[]> {
  const { data } = await apiClient.get<CrowdSigungu[]>('/crowd/sigungu', { params: { areaCd } })
  return data
}

export async function fetchAttractions(areaCd: string, sigunguCd: string): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/crowd/attractions', { params: { areaCd, sigunguCd } })
  return data
}

export async function fetchCrowdForecast(
  areaCd: string,
  sigunguCd: string,
  attraction: string,
): Promise<CrowdForecast | null> {
  const response = await apiClient.get<CrowdForecast>('/crowd', {
    params: { areaCd, sigunguCd, attraction },
    validateStatus: (status) => status === 200 || status === 204,
  })
  return response.status === 204 ? null : response.data
}

export async function fetchRelatedContests(attraction: string): Promise<ContestSummary[]> {
  const { data } = await apiClient.get<ContestSummary[]>('/crowd/contests', { params: { attraction } })
  return data
}
