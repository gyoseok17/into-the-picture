import { useInfiniteQuery } from '@tanstack/react-query'

import { fetchContests } from '../api'
import type { ContestQuery } from '../types'

// 수상작 목록 무한스크롤. Page.hasNext로 다음 페이지 여부 판단(시드 처리 주의).
export function useContests(query: ContestQuery) {
  return useInfiniteQuery({
    queryKey: ['contests', query],
    queryFn: ({ pageParam }) => fetchContests(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page.hasNext ? lastPage.page.page + 1 : undefined,
  })
}
