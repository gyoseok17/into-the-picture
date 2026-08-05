import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function LoginRequiredDialog({ open, returnTo, onClose }: { open: boolean; returnTo: string; onClose: () => void }) {
  if (!open) return null
  return <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}><Card className="w-full max-w-sm space-y-4 p-5" onClick={(event) => event.stopPropagation()}><div className="space-y-1"><h2 className="font-semibold">로그인이 필요한 기능이에요</h2><p className="text-sm text-muted-foreground">수상작을 저장하고 마이에서 다시 보려면 로그인해 주세요.</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>닫기</Button><Button asChild><Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`}>로그인</Link></Button></div></Card></div>
}
