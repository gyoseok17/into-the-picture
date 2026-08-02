import { useQuery } from '@tanstack/react-query'

import { fetchContestMap } from '../api'
import type { ContestQuery } from '../types'

// 지도 뷰 핀 목록. 목록과 같은 필터 상태로 호출하되 페이지네이션 없이 전체를 한 번에 받는다.
// enabled로 지도 뷰일 때만 요청(리스트 뷰에선 불필요한 호출 방지).
export function useContestMap(query: ContestQuery, enabled: boolean) {
  return useQuery({
    queryKey: ['contest-map', query],
    queryFn: () => fetchContestMap(query),
    enabled,
  })
}
