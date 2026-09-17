import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ComparisonCropEditor } from '@/features/comparison/components/ComparisonCropEditor'
import { ComparisonPhotoPickerDialog } from '@/features/comparison/components/ComparisonPhotoPickerDialog'
import {
  useComparisons,
  useCreateComparison,
} from '@/features/comparison/hooks/useComparison'
import { useContestDetail } from '@/features/contest/hooks/useContestDetail'
import { useUploadPhotoRecord } from '../hooks/usePhotoRecords'
import type { PhotoRecord, PhotoRecordBundle } from '../types'
import type { ComparisonCrop } from '@/features/comparison/types'

export function AlbumComparisonPicker({
  contestId,
  bundles,
  onClose,
}: {
  contestId: number
  bundles: PhotoRecordBundle[]
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null)
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(true)
  const contest = useContestDetail(contestId)
  const comparisons = useComparisons()
  const create = useCreateComparison()
  const upload = useUploadPhotoRecord()
  const existing = comparisons.data?.find((comparison) => comparison.contest.id === contestId)
  const photos = useMemo(() => bundles.flatMap((bundle) => bundle.photos), [bundles])
  const unavailablePhotoIds = useMemo(
    () => new Set(comparisons.data?.map((comparison) => comparison.userPhoto.id) ?? []),
    [comparisons.data],
  )

  function selectPhoto(photoId: number): void {
    if (create.isPending || existing) return
    if (unavailablePhotoIds.has(photoId)) return
    const photo = photos.find((item) => item.id === photoId)
    if (photo) setSelectedPhoto(photo)
  }

  function createWithCrop(crop: ComparisonCrop): void {
    if (create.isPending || existing || !selectedPhoto) return
    create.mutate(
      { contestId, userPhotoId: selectedPhoto.id, crop },
      { onSuccess: () => navigate(`/compare?contestId=${contestId}`) },
    )
  }

  function uploadAndSelect({ file, takenAt }: { file: File; takenAt: string }): void {
    if (upload.isPending || existing) return
    upload.mutate(
      { file, takenAt },
      {
        onSuccess: (photo) => {
          setSelectedPhoto(photo)
          setIsPhotoPickerOpen(false)
        },
      },
    )
  }

  useEffect(() => {
    if (existing) navigate(`/compare?contestId=${contestId}`, { replace: true })
  }, [contestId, existing, navigate])

  if (existing) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/45 p-3 sm:items-center sm:justify-center" onClick={onClose}>
      <Card
        role="dialog"
        aria-modal
        aria-label="수상작 비교 사진 선택"
        className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-primary">수상작 비교</p>
            <h2 className="mt-1 font-semibold">{contest.data?.title ?? '선택한 수상작'}</h2>
            <p className="mt-1 text-xs text-muted-foreground">앨범에서 사진 한 장을 골라 수상작과 나란히 놓아 보세요.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {contest.isError ? <ErrorState error={contest.error} onRetry={() => void contest.refetch()} /> : null}
        {comparisons.isError ? <ErrorState error={comparisons.error} onRetry={() => void comparisons.refetch()} /> : null}
        {contest.isPending || comparisons.isPending ? <LoadingState label="수상작 비교를 준비하는 중이에요." /> : null}
        {!contest.isPending && !contest.isError && !comparisons.isPending && !comparisons.isError ? (
          <>
            {!isPhotoPickerOpen && !selectedPhoto ? (
              <Button type="button" className="mt-5 w-full" onClick={() => setIsPhotoPickerOpen(true)}>사진 고르기</Button>
            ) : null}
            {create.isError || upload.isError ? <p role="alert" className="mt-4 text-sm text-destructive">수상작 비교를 저장하지 못했어요. 다시 시도해 주세요.</p> : null}
            {selectedPhoto && contest.data ? (
              <ComparisonCropEditor
                contestImageUrl={contest.data.imageUrl}
                photoUrl={selectedPhoto.url}
                photoAlt={selectedPhoto.originalFilename ?? '내 사진'}
                pending={create.isPending}
                onCancel={() => setSelectedPhoto(null)}
                onConfirm={createWithCrop}
              />
            ) : null}
            {isPhotoPickerOpen ? (
              <ComparisonPhotoPickerDialog
                photos={photos}
                bundles={bundles}
                unavailablePhotoIds={unavailablePhotoIds}
                loading={false}
                uploadPending={upload.isPending || create.isPending}
                selectedId={selectedPhoto?.id ?? 0}
                onClose={onClose}
                onSelect={(photoId) => {
                  selectPhoto(photoId)
                  setIsPhotoPickerOpen(false)
                }}
                onUpload={uploadAndSelect}
              />
            ) : null}
          </>
        ) : null}
      </Card>
    </div>
  )
}
