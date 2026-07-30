import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/state/EmptyState'

export default function NotFoundPage() {
  return (
    <EmptyState
      title="페이지를 찾을 수 없어요"
      description="주소를 다시 확인해주세요."
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/">홈으로</Link>
        </Button>
      }
    />
  )
}
