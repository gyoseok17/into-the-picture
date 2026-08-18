import { apiClient } from '@/lib/apiClient'
import type { Page } from '@/lib/api-types'
import type { ContestSummary } from '@/features/contest/types'

const HOME_LEAD_CONTEST_SIZE = 100

/** 홈 대표작 선택용 전체 수상작 목록. 일반 목록의 무한 스크롤 크기와 분리한다. */
export async function fetchHomeLeadContests(): Promise<ContestSummary[]> {
  const { data } = await apiClient.get<Page<ContestSummary>>('/contests', {
    params: { page: 1, size: HOME_LEAD_CONTEST_SIZE },
  })
  return data.content
}
