import { useQuery } from '@tanstack/react-query'

import { fetchContestDetail } from '../api'

// 수상작 상세. 유효한 id일 때만 호출.
export function useContestDetail(id: number) {
  return useQuery({
    queryKey: ['contest', id],
    queryFn: () => fetchContestDetail(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}
