import { useQuery } from '@tanstack/react-query'

import { fetchContestDetail } from '../api'
import { contestQueryKeys } from '../queryKeys'

// 수상작 상세. 유효한 id일 때만 호출.
export function useContestDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: contestQueryKeys.detail(id),
    queryFn: () => fetchContestDetail(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}
