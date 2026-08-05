import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** 낙관적 저장이 서버에서 거절되면 원복 사실을 명확히 알린다. */
export function FavoriteSaveErrorNotice({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <div role="alert" className="fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background p-3 shadow-lg"><p className="flex-1 text-sm">저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.</p><Button variant="ghost" size="icon" onClick={onClose} aria-label="안내 닫기"><X className="h-4 w-4" /></Button></div>
}
