import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { Button } from '@/components/ui/button'
import { useDocumentScrollLock } from '@/hooks/useDocumentScrollLock'
import { usePhotoRecordBundles, useUploadPhotoRecord } from '@/features/photo-record/hooks/usePhotoRecords'
import { useContestDetail } from '@/features/contest/hooks/useContestDetail'
import { getComparisonPhotoDisplay } from '../lib/comparisonPhotoDisplay'
import type { PhotoComparison, UserPhoto } from '../types'
import { ComparisonCropEditor } from './ComparisonCropEditor'
import { ComparisonPhotoPickerDialog } from './ComparisonPhotoPickerDialog'
import { ComparisonPlacementPair } from './ComparisonPlacementPair'
import {
  useDeleteComparison,
  useReplaceComparisonPhoto,
  useUpdateComparisonCrop,
} from '../hooks/useComparison'

type EditStep = 'replace-picker' | 'replace-crop' | 'crop' | 'delete-confirm' | null

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
  const [editStep, setEditStep] = useState<EditStep>(null)
  const [replacementPhoto, setReplacementPhoto] = useState<UserPhoto | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const selectedComparison = comparisons.find((comparison) => comparison.id === selectedComparisonId) ?? comparisons[0]
  const photoDisplay = selectedComparison ? getComparisonPhotoDisplay(selectedComparison.userPhoto) : null
  const remove = useDeleteComparison()
  const replace = useReplaceComparisonPhoto()
  const changeCrop = useUpdateComparisonCrop()
  const upload = useUploadPhotoRecord()
  const contestDetail = useContestDetail(
    selectedComparison?.contest.id ?? 0,
    editStep === 'replace-picker' || editStep === 'replace-crop' || editStep === 'crop',
  )
  const bundles = usePhotoRecordBundles(editStep === 'replace-picker')
  const albumPhotos = useMemo(
    () => bundles.data?.flatMap((bundle) => bundle.photos) ?? [],
    [bundles.data],
  )
  const unavailablePhotoIds = useMemo(
    () => new Set(comparisons.map((comparison) => comparison.userPhoto.id)),
    [comparisons],
  )

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
      event.stopImmediatePropagation()
      if (editStep === 'delete-confirm') {
        setEditStep('crop')
        return
      }
      if (editStep === 'replace-picker') {
        setEditStep('crop')
        return
      }
      if (editStep === 'replace-crop') {
        setReplacementPhoto(null)
        setEditStep('replace-picker')
        return
      }
      if (editStep === 'crop') {
        setEditStep(null)
        setReplacementPhoto(null)
        return
      }
      close()
    }
    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [close, editStep])

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
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditStep('crop')} disabled={remove.isPending || replace.isPending || changeCrop.isPending}>수정</Button>
          </div>
          {remove.isError || replace.isError || changeCrop.isError || upload.isError ? <p role="alert" className="mt-2 text-sm text-destructive">수정 내용을 저장하지 못했어요. 다시 시도해 주세요.</p> : null}

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

      {editStep === 'replace-picker' && contestDetail.data ? <ComparisonPhotoPickerDialog
        photos={albumPhotos}
        unavailablePhotoIds={unavailablePhotoIds}
        loading={bundles.isPending}
        uploadPending={upload.isPending}
        selectedId={0}
        targetLocation={{
          regionCode: contestDetail.data.mapRegionCode,
          cityCode: contestDetail.data.mapCityCode,
        }}
        overlayClassName="z-[120]"
        onClose={() => setEditStep('crop')}
        onSelect={(photoId) => {
          const photo = albumPhotos.find((item) => item.id === photoId)
          if (!photo) return
          setReplacementPhoto(photo)
          setEditStep('replace-crop')
        }}
        onUpload={({ file, takenAt }) => upload.mutate(
          { file, takenAt },
          {
            onSuccess: (photo) => {
              setReplacementPhoto(photo)
              setEditStep('replace-crop')
            },
          },
        )}
      /> : null}

      {editStep === 'replace-crop' && replacementPhoto && contestDetail.data ? <ComparisonCropEditor
        contestImageUrl={contestDetail.data.imageUrl}
        photoUrl={replacementPhoto.url}
        photoAlt={replacementPhoto.originalFilename ?? '내 사진'}
        pending={replace.isPending}
        overlayClassName="z-[130]"
        onCancel={() => {
          setReplacementPhoto(null)
          setEditStep('replace-picker')
        }}
        onConfirm={(crop) => replace.mutate(
          { id: selectedComparison.id, userPhotoId: replacementPhoto.id, crop },
          { onSuccess: close },
        )}
      /> : null}

      {(editStep === 'crop' || editStep === 'replace-picker' || (editStep === 'replace-crop' && replacementPhoto)) && !contestDetail.data ? <ComparisonEditLoadingOverlay
        error={contestDetail.isError}
        onBack={() => setEditStep(editStep === 'replace-crop' ? 'replace-picker' : editStep === 'replace-picker' ? 'crop' : null)}
        onRetry={() => void contestDetail.refetch()}
      /> : null}

      {editStep === 'crop' && contestDetail.data ? <ComparisonCropEditor
        contestImageUrl={contestDetail.data.imageUrl}
        photoUrl={selectedComparison.userPhoto.url}
        photoAlt={selectedComparison.userPhoto.originalFilename ?? '내 사진'}
        initialCrop={selectedComparison.crop}
        pending={changeCrop.isPending}
        overlayClassName="z-[130]"
        onCancel={() => setEditStep(null)}
        onConfirm={(crop) => changeCrop.mutate({ id: selectedComparison.id, crop }, { onSuccess: close })}
        actions={<>
          <Button type="button" variant="outline" size="sm" disabled={changeCrop.isPending || remove.isPending || replace.isPending || upload.isPending} onClick={() => setEditStep('replace-picker')}>사진 변경</Button>
          <Button type="button" variant="destructive" size="sm" disabled={changeCrop.isPending || remove.isPending || replace.isPending || upload.isPending} onClick={() => setEditStep('delete-confirm')}>삭제</Button>
        </>}
      /> : null}

      {editStep === 'delete-confirm' ? <ComparisonDeleteConfirm
        pending={remove.isPending}
        onClose={() => setEditStep('crop')}
        onDelete={(deletePhoto) => remove.mutate({ id: selectedComparison.id, deletePhoto }, { onSuccess: close })}
      /> : null}
    </>,
    document.body,
  )
}

function ComparisonEditLoadingOverlay({ error, onBack, onRetry }: { error: boolean; onBack: () => void; onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-4">
      <section role="dialog" aria-modal aria-label="수상작 불러오기" className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl">
        {error ? <><h3 className="font-semibold">수상작을 불러오지 못했어요</h3><p className="mt-2 text-sm text-muted-foreground">사진 비율을 맞추려면 수상작 원본이 필요해요.</p><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={onBack}>뒤로</Button><Button type="button" size="sm" onClick={onRetry}>다시 시도</Button></div></> : <p className="text-sm text-muted-foreground">수상작 원본을 불러오는 중이에요.</p>}
      </section>
    </div>
  )
}

function ComparisonDeleteConfirm({
  pending,
  onClose,
  onDelete,
}: {
  pending: boolean
  onClose: () => void
  onDelete: (deletePhoto: boolean) => void
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <section role="dialog" aria-modal aria-label="비교 결과 삭제" className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="font-semibold">비교 결과를 삭제할까요?</h3>
        <p className="mt-2 text-sm text-muted-foreground">비교 결과만 지우거나, 앨범 사진까지 함께 지울 수 있어요.</p>
        <div className="mt-5 grid gap-2">
          <Button type="button" variant="destructive" disabled={pending} onClick={() => onDelete(false)}>결과만 삭제</Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => onDelete(true)}>사진도 삭제</Button>
        </div>
        <div className="mt-4 flex justify-end"><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onClose}>취소</Button></div>
      </section>
    </div>
  )
}
