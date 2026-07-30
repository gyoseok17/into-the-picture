import { apiClient } from '@/lib/apiClient'
import type { Page } from '@/lib/api-types'
import type {
  ContestDetail,
  ContestQuery,
  ContestSummary,
  CrowdForecast,
  FilterOptions,
} from './types'

// 목록 페이지 크기(NFR: size 20 + 무한스크롤).
export const CONTEST_PAGE_SIZE = 20

// 빈/undefined 쿼리값은 제거해 깔끔한 요청을 만든다.
function cleanParams(query: ContestQuery): Record<string, string> {
  const entries = Object.entries(query).filter(
    ([, value]) => value != null && value !== '',
  ) as [string, string][]
  return Object.fromEntries(entries)
}

export async function fetchContests(
  query: ContestQuery,
  page: number,
): Promise<Page<ContestSummary>> {
  const { data } = await apiClient.get<Page<ContestSummary>>('/contests', {
    params: { ...cleanParams(query), page, size: CONTEST_PAGE_SIZE },
  })
  return data
}

export async function fetchContestFilters(): Promise<FilterOptions> {
  const { data } = await apiClient.get<FilterOptions>('/contests/filters')
  return data
}

export async function fetchContestDetail(id: number): Promise<ContestDetail> {
  const { data } = await apiClient.get<ContestDetail>(`/contests/${id}`)
  return data
}

// 집중률: 매칭 없으면 204 → null(섹션 숨김, 에러 아님).
export async function fetchContestCrowd(
  id: number,
): Promise<CrowdForecast | null> {
  const response = await apiClient.get<CrowdForecast>(`/contests/${id}/crowd`, {
    validateStatus: (status) => status === 200 || status === 204,
  })
  if (response.status === 204) return null
  return response.data
}
