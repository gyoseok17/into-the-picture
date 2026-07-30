import { useQuery } from '@tanstack/react-query'

import { fetchContestCrowd } from '../api'

// 집중률: crowdAvailable=true일 때만 호출(enabled). 결과 null(204)이면 화면에서 섹션 숨김.
export function useContestCrowd(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['contest-crowd', id],
    queryFn: () => fetchContestCrowd(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}
