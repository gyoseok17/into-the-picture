import type { ReactNode } from 'react'

import type { MobileGridColumns } from '@/features/display-preferences/hooks/useMobileGridColumns'
import { mobileGridClassName } from '@/features/display-preferences/mobileGridClassName'

// 반응형 카드 그리드: 모바일 1열 → sm 2열 → lg 3열 → xl 4열(docs/08·09).
// 카드와 스켈레톤이 같은 레이아웃을 쓰도록 한 곳에서 정의.
export function ContestGrid({
  children,
  mobileColumns = 2,
}: {
  children: ReactNode
  mobileColumns?: MobileGridColumns
}) {
  return (
    <div className={mobileGridClassName(mobileColumns, 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}>
      {children}
    </div>
  )
}
