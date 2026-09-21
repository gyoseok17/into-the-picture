import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Move, RotateCcw, ZoomIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ComparisonCrop } from '../types'
import { clamp, ComparisonCropImage, comparisonCropOrDefault, useImageAspectRatio } from './ComparisonCropImage'

interface ComparisonCropEditorProps {
  contestImageUrl: string
  photoUrl: string
  photoAlt: string
  initialCrop?: ComparisonCrop | null
  onCancel: () => void
  onConfirm: (crop: ComparisonCrop) => void
  pending?: boolean
  overlayClassName?: string
  actions?: ReactNode
}

/** Edits only a comparison presentation crop; the original album photo is never altered. */
export function ComparisonCropEditor({
  contestImageUrl,
  photoUrl,
  photoAlt,
  initialCrop,
  onCancel,
  onConfirm,
  pending = false,
  overlayClassName = 'z-[90]',
  actions,
}: ComparisonCropEditorProps) {
  const contestAspectRatio = useImageAspectRatio(contestImageUrl)
  const photoAspectRatio = useImageAspectRatio(photoUrl)
  const [crop, setCrop] = useState<ComparisonCrop>(() => ({
    ...comparisonCropOrDefault(initialCrop),
    aspectRatio: initialCrop?.aspectRatio ?? contestAspectRatio,
  }))
  // Pointer movement can finish immediately before confirmation. Keep the
  // latest value outside React's asynchronous render cycle so the saved crop
  // always matches the most recently requested display position.
  const cropRef = useRef(crop)
  const dragStart = useRef<{ x: number; y: number; crop: ComparisonCrop } | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const editorCrop = useMemo(
    () => ({ ...crop, aspectRatio: contestAspectRatio }),
    [contestAspectRatio, crop],
  )

  function currentEditorCrop(): ComparisonCrop {
    return { ...cropRef.current, aspectRatio: contestAspectRatio }
  }

  function commitCrop(next: ComparisonCrop): void {
    cropRef.current = next
    setCrop(next)
  }

  function reset(): void {
    commitCrop({ aspectRatio: contestAspectRatio, zoom: 1, offsetX: 0, offsetY: 0 })
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (pending) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = { x: event.clientX, y: event.clientY, crop: currentEditorCrop() }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    const start = dragStart.current
    const viewport = viewportRef.current
    if (!start || !viewport) return
    const rect = viewport.getBoundingClientRect()
    const effectiveWidth = (photoAspectRatio >= editorCrop.aspectRatio ? photoAspectRatio / editorCrop.aspectRatio : 1) * editorCrop.zoom
    const effectiveHeight = (photoAspectRatio >= editorCrop.aspectRatio ? 1 : editorCrop.aspectRatio / photoAspectRatio) * editorCrop.zoom
    const overflowX = Math.max(1, rect.width * (effectiveWidth - 1))
    const overflowY = Math.max(1, rect.height * (effectiveHeight - 1))
    commitCrop({
      ...cropRef.current,
      offsetX: clamp(start.crop.offsetX + ((event.clientX - start.x) * 2) / overflowX, -1, 1),
      offsetY: clamp(start.crop.offsetY + ((event.clientY - start.y) * 2) / overflowY, -1, 1),
    })
  }

  function stopDragging(): void {
    dragStart.current = null
  }

  return (
    <div className={`fixed inset-0 ${overlayClassName} flex items-center justify-center bg-black/55 p-4`} onMouseDown={onCancel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-crop-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">수상작 비교</p>
          <h2 id="comparison-crop-title" className="text-lg font-semibold">비교할 부분을 맞춰 주세요</h2>
          <p className="text-sm text-muted-foreground">수상작 원본 비율에 맞춰 사진을 움직이거나 확대할 수 있어요.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-muted/40" style={{ aspectRatio: contestAspectRatio }}>
            <img
              src={contestImageUrl}
              alt="수상작 원본"
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              className="h-full w-full object-contain"
            />
          </div>
          <div
            ref={viewportRef}
            className="touch-none cursor-grab overflow-hidden rounded-2xl border-2 border-primary/70 active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onDragStart={(event) => event.preventDefault()}
          >
            <ComparisonCropImage src={photoUrl} alt={photoAlt} crop={editorCrop} />
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl bg-muted/45 p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <ZoomIn className="h-4 w-4 text-primary" aria-hidden />
            <span className="shrink-0">확대</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={crop.zoom}
              disabled={pending}
              onChange={(event) => commitCrop({ ...cropRef.current, zoom: Number(event.target.value) })}
              className="w-full accent-primary"
              aria-label="사진 확대 정도"
            />
            <span className="w-9 text-right text-xs text-muted-foreground">{crop.zoom.toFixed(2)}×</span>
          </label>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Move className="h-3.5 w-3.5" aria-hidden />사진을 드래그해 위치를 조절하세요.</p>
        </div>

        {actions ? <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">{actions}</div> : null}

        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />처음으로
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>취소</Button>
            <Button type="button" disabled={pending} onClick={() => onConfirm(currentEditorCrop())}>{pending ? '저장 중…' : '이 구도로 저장'}</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
