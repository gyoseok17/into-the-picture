import { useQuery } from '@tanstack/react-query'

import { fetchContestFilters } from '../api'

// 필터 옵션(계절·등급·부문·지역). 자주 변하지 않아 길게 캐시.
export function useContestFilters() {
  return useQuery({
    queryKey: ['contest-filters'],
    queryFn: fetchContestFilters,
    staleTime: 1000 * 60 * 30,
  })
}
