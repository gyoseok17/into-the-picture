import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function ComparisonErrorNotice({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null

  return (
    <div role="alert" className="fixed inset-x-4 bottom-5 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
      <p className="flex-1 text-sm">{message}</p>
      <Button variant="ghost" size="icon" aria-label="오류 알림 닫기" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
