import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { Button } from '@/components/ui/button'
import { useDocumentScrollLock } from '@/hooks/useDocumentScrollLock'
import { getComparisonPhotoDisplay } from '../lib/comparisonPhotoDisplay'
import type { PhotoComparison } from '../types'
import { ComparisonPlacementPair } from './ComparisonPlacementPair'
import { useDeleteComparison } from '../hooks/useComparison'

/** Opens a saved result above an album photo without leaving the album route. */
export function PhotoComparisonResultDialog({
  comparisons,
  initialComparisonId,
  onClose,
  returnFocusRef,
}: {
  comparisons: PhotoComparison[]
  initialComparisonId: number
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const [selectedComparisonId, setSelectedComparisonId] = useState(initialComparisonId)
  const [isDeleteChoiceOpen, setIsDeleteChoiceOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const selectedComparison = comparisons.find((comparison) => comparison.id === selectedComparisonId) ?? comparisons[0]
  const photoDisplay = selectedComparison ? getComparisonPhotoDisplay(selectedComparison.userPhoto) : null
  const remove = useDeleteComparison()

  const close = useCallback(() => {
    onClose()
    window.requestAnimationFrame(() => returnFocusRef?.current?.focus())
  }, [onClose, returnFocusRef])

  useDocumentScrollLock()

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Album lightboxes also listen for Escape. This overlay is the topmost
      // surface, so consume the event before those listeners close the photo.
      event.stopImmediatePropagation()
      close()
    }
    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [close])

  if (!selectedComparison) return null

  return createPortal(
    <>
    <div
      role="dialog"
      aria-modal
      aria-labelledby="album-comparison-result-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
      onClick={close}
    >
      <section
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-background p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">수상작 비교</p>
            <h2 id="album-comparison-result-title" className="truncate text-lg font-semibold">
              {selectedComparison.displayMode === 'PHOTO_ONLY' ? photoDisplay?.title : selectedComparison.contest.title}
            </h2>
          </div>
          <Button ref={closeButtonRef} type="button" variant="ghost" size="icon" aria-label="비교 결과 닫기" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ComparisonPlacementPair comparison={selectedComparison} showDesktopDirection={false} />

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3">
          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setIsDeleteChoiceOpen(true)} disabled={remove.isPending}>삭제</Button>
        </div>
        {remove.isError ? <p role="alert" className="mt-2 text-sm text-destructive">비교 결과를 삭제하지 못했어요. 다시 시도해 주세요.</p> : null}

        {comparisons.length > 1 ? (
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-muted-foreground">연결된 비교 {comparisons.length}건</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {comparisons.map((comparison) => {
                const selected = comparison.id === selectedComparison.id
                return (
                  <button
                    key={comparison.id}
                    type="button"
                    aria-label={`${comparison.contest.title} 비교 결과 보기`}
                    aria-pressed={selected}
                    onClick={() => setSelectedComparisonId(comparison.id)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${selected ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <AspectImage src={comparison.contest.thumbUrl} alt="" ratioClassName="aspect-square" className="h-full w-full" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
    {/* Nested overlays are siblings of the result backdrop: their clicks must
        never bubble into the result dialog's outside-click close handler. */}
      {isDeleteChoiceOpen ? <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4" onClick={() => setIsDeleteChoiceOpen(false)}><section role="dialog" aria-modal aria-label="비교 결과 삭제" className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><h3 className="font-semibold">비교 결과를 삭제할까요?</h3><p className="mt-2 text-sm text-muted-foreground">사진은 앨범에 남기거나 함께 삭제할 수 있어요.</p><div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteChoiceOpen(false)}>취소</Button><Button type="button" variant="destructive" size="sm" onClick={() => remove.mutate({ id: selectedComparison.id, deletePhoto: false }, { onSuccess: close })}>결과만 삭제</Button><Button type="button" variant="destructive" size="sm" onClick={() => remove.mutate({ id: selectedComparison.id, deletePhoto: true }, { onSuccess: close })}>사진도 삭제</Button></div></section></div> : null}
    </>,
    document.body,
  )
}
