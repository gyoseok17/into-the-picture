import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  label?: string
  className?: string
}

// 단순 로딩(중앙 스피너). 목록·그리드는 feature의 Skeleton을 우선 사용한다.
export function LoadingState({ label = '불러오는 중…', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 py-16 text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
