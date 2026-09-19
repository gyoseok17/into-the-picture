import { Check } from 'lucide-react'
import { useRef, useState, type Ref } from 'react'

import type { PhotoComparison } from '../types'
import { ComparisonCropImage } from './ComparisonCropImage'
import { PhotoComparisonResultDialog } from './PhotoComparisonResultDialog'

/** A compact visual entry for a contest that already has a saved photo comparison. */
export function ContestComparisonEntry({
  comparison,
  onOpen,
  triggerRef,
}: {
  comparison: PhotoComparison
  /** Allows overlays to keep their current context while showing the saved result. */
  onOpen?: () => void
  triggerRef?: Ref<HTMLButtonElement>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const localTriggerRef = useRef<HTMLButtonElement>(null)
  const contents = <>
    <ComparisonCropImage src={comparison.userPhoto.url} alt="" crop={comparison.crop} className="aspect-square" />
    <span aria-hidden className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-sm"><Check className="h-3 w-3" /></span>
    <span className="sr-only">저장한 수상작 비교 결과 보기</span>
  </>
  const className = 'group relative block w-12 -rotate-[2deg] rounded-sm bg-white p-1.5 shadow-md transition-transform hover:rotate-0 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  const open = onOpen ?? (() => setIsOpen(true))
  const resolvedTriggerRef = triggerRef ?? localTriggerRef

  return <>
    <button ref={resolvedTriggerRef} type="button" onClick={open} aria-label="저장한 수상작 비교 결과 보기" title="저장한 수상작 비교 결과 보기" className={className}>{contents}</button>
    {isOpen ? <PhotoComparisonResultDialog comparisons={[comparison]} initialComparisonId={comparison.id} returnFocusRef={localTriggerRef} onClose={() => setIsOpen(false)} /> : null}
  </>
}
