import { useQuery } from '@tanstack/react-query'

import { fetchHomeLeadContests } from '../api'

/** 현재 달에 촬영한 수상작을 홈 대표 사진 후보로 고르기 위한 별도 조회다. */
export function useHomeLeadContests() {
  return useQuery({
    queryKey: ['home', 'lead-contests'],
    queryFn: fetchHomeLeadContests,
  })
}
