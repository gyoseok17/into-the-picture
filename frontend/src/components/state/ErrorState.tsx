import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isAppError } from '@/lib/apiClient'

interface ErrorStateProps {
  error?: unknown
  onRetry?: () => void
  className?: string
}

// 에러 + 재시도. apiClient가 정규화한 AppError의 message를 그대로 보여준다.
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const message = isAppError(error)
    ? error.message
    : '문제가 발생했어요. 잠시 후 다시 시도해주세요.'

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 py-16 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  )
}
