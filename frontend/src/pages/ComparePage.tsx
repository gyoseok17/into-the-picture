import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { AspectImage } from '@/components/AspectImage'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Button } from '@/components/ui/button'
import { ComparisonErrorNotice } from '@/features/comparison/components/ComparisonErrorNotice'
import { ComparisonCropEditor } from '@/features/comparison/components/ComparisonCropEditor'
import { ComparisonPlacementPair } from '@/features/comparison/components/ComparisonPlacementPair'
import { ComparisonPhotoPickerDialog } from '@/features/comparison/components/ComparisonPhotoPickerDialog'
import { getComparisonPhotoDisplay } from '@/features/comparison/lib/comparisonPhotoDisplay'
import { Card } from '@/components/ui/card'
import {
  useComparisons,
  useCreateComparison,
  useDeleteComparison,
  useReplaceComparisonPhoto,
  useUploadUserPhoto,
  useUserPhotos,
} from '@/features/comparison/hooks/useComparison'
import type { PhotoComparison, UserPhoto } from '@/features/comparison/types'
import type { ComparisonCrop } from '@/features/comparison/types'
import { useContestDetail } from '@/features/contest/hooks/useContestDetail'
import type { UserPhotoUploadInput } from '@/features/comparison/api'

export default function ComparePage() {
  const [params] = useSearchParams()
  const requestedContestId = Number(params.get('contestId')) || 0
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const [photoId, setPhotoId] = useState(0)
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false)
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false)
  const comparisons = useComparisons()
  const photos = useUserPhotos()
  const upload = useUploadUserPhoto()
  const create = useCreateComparison()
  const contest = useContestDetail(requestedContestId)

  const result = useMemo(
    () => comparisons.data?.find((item) => item.id === selectedResult),
    [comparisons.data, selectedResult],
  )
  const existingComparison = useMemo(
    () => comparisons.data?.find((item) => item.contest.id === requestedContestId) ?? null,
    [comparisons.data, requestedContestId],
  )
  const usedPhotoIds = useMemo(() => {
    return new Set(comparisons.data?.map((item) => item.userPhoto.id) ?? [])
  }, [comparisons.data, photos.data])
  const selectedPhoto = photos.data?.find((photo) => photo.id === photoId)

  useEffect(() => {
    if (requestedContestId && !comparisons.isPending && existingComparison) {
      setSelectedResult(existingComparison.id)
    }
  }, [comparisons.isPending, existingComparison, requestedContestId])

  function selectPhoto(id: number): void {
    setPhotoId(id)
    setIsPhotoPickerOpen(false)
  }

  function addPhoto(input: UserPhotoUploadInput): void {
    upload.mutate(input, { onSuccess: (photo) => selectPhoto(photo.id) })
  }

  function saveComparison(): void {
    if (!requestedContestId || !photoId || existingComparison || !contest.data) return
    setIsCropEditorOpen(true)
  }

  function createWithCrop(crop: ComparisonCrop): void {
    if (!requestedContestId || !photoId || existingComparison) return
    create.mutate(
      { contestId: requestedContestId, userPhotoId: photoId, crop },
      { onSuccess: (created) => { setIsCropEditorOpen(false); setSelectedResult(created.id) } },
    )
  }

  const shouldShowComposer = requestedContestId && !comparisons.isPending && !existingComparison

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-primary">PHOTO ARCHIVE</p>
        <h1 className="text-2xl font-semibold tracking-tight">수상작 비교</h1>
        <p className="text-sm text-muted-foreground">완성한 수상작 비교 결과를 다시 보고 관리해요.</p>
      </header>

      {existingComparison ? (
        <p role="status" className="rounded-lg border border-primary/15 bg-primary/[0.05] px-3 py-2 text-sm text-primary">
          이미 완성한 수상작 비교가 있어 결과를 열었어요.
        </p>
      ) : null}

      {result ? <ComparisonView comparison={result} onClose={() => setSelectedResult(null)} /> : null}

      {shouldShowComposer ? (
        <Card className="space-y-4 border-primary/20 bg-primary/[0.03] p-4">
          <div>
            <h2 className="font-semibold">선택한 수상작 비교</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              수상작은 고정되어 있어요. 내 사진만 골라 기록을 보세요.
            </p>
          </div>
          <PhotoAlbumStrip photo={selectedPhoto ?? null} onOpen={() => setIsPhotoPickerOpen(true)} />
          <div className="flex justify-end">
            <Button disabled={!selectedPhoto || create.isPending || contest.isPending || contest.isError} onClick={saveComparison}>
              {create.isPending ? '저장 중...' : '수상작 비교'}
            </Button>
          </div>
        </Card>
      ) : null}

      {isPhotoPickerOpen ? (
        <ComparisonPhotoPickerDialog
          photos={photos.data ?? []}
          unavailablePhotoIds={usedPhotoIds}
          loading={photos.isPending || comparisons.isPending}
          uploadPending={upload.isPending}
          selectedId={photoId}
          onClose={() => setIsPhotoPickerOpen(false)}
          onSelect={selectPhoto}
          onUpload={addPhoto}
        />
      ) : null}

      {isCropEditorOpen && selectedPhoto && contest.data ? (
        <ComparisonCropEditor
          contestImageUrl={contest.data.imageUrl}
          photoUrl={selectedPhoto.url}
          photoAlt={selectedPhoto.originalFilename ?? '내 사진'}
          pending={create.isPending}
          onCancel={() => setIsCropEditorOpen(false)}
          onConfirm={createWithCrop}
        />
      ) : null}

      <ComparisonHistory
        comparisons={comparisons.data ?? []}
        isLoading={comparisons.isPending}
        error={comparisons.isError ? comparisons.error : null}
        onRetry={() => void comparisons.refetch()}
        onOpen={setSelectedResult}
      />
    </section>
  )
}

function ComparisonHistory({
  comparisons,
  isLoading,
  error,
  onRetry,
  onOpen,
}: {
  comparisons: PhotoComparison[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  onOpen: (id: number) => void
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-medium text-primary">HISTORY</p>
        <h2 className="text-lg font-semibold">비교 결과</h2>
      </div>

      {isLoading ? <LoadingState label="비교 결과를 불러오는 중이에요." /> : null}
      {!isLoading && error ? <ErrorState error={error} onRetry={onRetry} /> : null}
      {!isLoading && !error && comparisons.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((item) => (
            <ComparisonResultCard key={item.id} comparison={item} onOpen={onOpen} />
          ))}
        </div>
      ) : null}
      {!isLoading && !error && !comparisons.length ? <ComparisonEmptyState /> : null}
    </section>
  )
}

function ComparisonResultCard({ comparison, onOpen }: { comparison: PhotoComparison; onOpen: (id: number) => void }) {
  const isPhotoOnly = comparison.displayMode === 'PHOTO_ONLY'
  const photoDisplay = getComparisonPhotoDisplay(comparison.userPhoto)
  const title = isPhotoOnly ? photoDisplay.title : comparison.contest.title

  return (
    <button
      type="button"
      onClick={() => onOpen(comparison.id)}
      className="overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md"
    >
      <div className={isPhotoOnly ? '' : 'grid grid-cols-2'}>
        {comparison.displayMode === 'WITH_CONTEST' ? (
          <AspectImage src={comparison.contest.thumbUrl} alt={comparison.contest.title} />
        ) : null}
        <AspectImage src={comparison.userPhoto.url} alt="내 사진" />
      </div>
      <div className="space-y-1 p-3">
        <p className="text-xs text-muted-foreground">{isPhotoOnly ? photoDisplay.subtitle ?? '내 사진' : '수상작 · 내 사진'}</p>
        <p className="line-clamp-1 text-sm font-medium">{title}</p>
      </div>
    </button>
  )
}

function ComparisonEmptyState() {
  return (
    <EmptyState
      title="아직 수상작 비교 결과가 없어요"
      description="수상작에서 마음에 드는 작품과 내 사진을 놓아 보세요."
      action={
        <Button asChild>
          <Link to="/contests">수상작 보러 가기</Link>
        </Button>
      }
    />
  )
}

function PhotoAlbumStrip({ photo, onOpen }: { photo: UserPhoto | null; onOpen: () => void }) {
  const display = photo ? getComparisonPhotoDisplay(photo) : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-background p-3 text-left hover:bg-muted/40"
    >
      <ImagePlus className="h-5 w-5 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{display?.title ?? '내 사진 고르기'}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {photo ? display?.subtitle ?? '다른 사진으로 바꾸기' : '내 앨범에서 사진을 선택하거나 추가해요.'}
        </span>
      </span>
      {photo ? (
        <AspectImage
          src={photo.url}
          alt=""
          ratioClassName="aspect-square"
          className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
        />
      ) : null}
    </button>
  )
}

function ComparisonView({ comparison, onClose }: { comparison: PhotoComparison; onClose: () => void }) {
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false)
  const [replacementPhoto, setReplacementPhoto] = useState<UserPhoto | null>(null)
  const [isDeleteChoiceOpen, setIsDeleteChoiceOpen] = useState(false)
  const remove = useDeleteComparison()
  const replace = useReplaceComparisonPhoto()
  const photos = useUserPhotos()
  const comparisons = useComparisons()
  const upload = useUploadUserPhoto()
  const contest = useContestDetail(comparison.contest.id)
  const photoDisplay = getComparisonPhotoDisplay(comparison.userPhoto)
  const usedPhotoIds = new Set(comparisons.data?.map((item) => item.userPhoto.id) ?? [])

  function replacePhoto(photoId: number): void {
    if (usedPhotoIds.has(photoId)) return
    const photo = (photos.data ?? []).find((item) => item.id === photoId)
    if (!photo) return
    setIsPhotoPickerOpen(false)
    setReplacementPhoto(photo)
  }

  function addAndReplace(input: UserPhotoUploadInput): void {
    upload.mutate(input, { onSuccess: (photo) => { setIsPhotoPickerOpen(false); setReplacementPhoto(photo) } })
  }

  function replaceWithCrop(crop: ComparisonCrop): void {
    if (!replacementPhoto) return
    replace.mutate(
      { id: comparison.id, userPhotoId: replacementPhoto.id, crop },
      { onSuccess: () => { setReplacementPhoto(null); onClose() } },
    )
  }

  const actionErrorMessage = remove.isError
    ? '비교 결과를 삭제하지 못했어요. 다시 시도해 주세요.'
    : replace.isError
      ? '사진을 바꾸지 못했어요. 다시 선택해 주세요.'
      : upload.isError
        ? '사진을 추가하지 못했어요. 다시 선택해 주세요.'
        : null

  function resetActionErrors(): void {
    remove.reset()
    replace.reset()
    upload.reset()
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="수상작 비교 결과 상세"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <section
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl space-y-3 overflow-y-auto rounded-xl border bg-card p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <ComparisonViewHeader
          title={comparison.displayMode === 'PHOTO_ONLY' ? photoDisplay.title : comparison.contest.title}
          onClose={onClose}
        />
        <ComparisonPlacementPair comparison={comparison} />
        <ComparisonActions
          isPhotoChangePending={replace.isPending || upload.isPending}
          isDeletePending={remove.isPending}
          onChangePhoto={() => setIsPhotoPickerOpen(true)}
          onDelete={() => setIsDeleteChoiceOpen(true)}
        />

        {isDeleteChoiceOpen ? (
          <DeleteComparisonDialog
            isDeleting={remove.isPending}
            onClose={() => setIsDeleteChoiceOpen(false)}
            onDeleteResult={() => remove.mutate({ id: comparison.id, deletePhoto: false }, { onSuccess: onClose })}
            onDeletePhoto={() => remove.mutate({ id: comparison.id, deletePhoto: true }, { onSuccess: onClose })}
          />
        ) : null}
        {isPhotoPickerOpen ? (
          <ComparisonPhotoPickerDialog
            photos={photos.data ?? []}
            unavailablePhotoIds={usedPhotoIds}
            loading={photos.isPending || comparisons.isPending}
            uploadPending={upload.isPending || replace.isPending}
            selectedId={0}
            onClose={() => setIsPhotoPickerOpen(false)}
            onSelect={replacePhoto}
            onUpload={addAndReplace}
          />
        ) : null}
        {replacementPhoto && contest.data ? (
          <ComparisonCropEditor
            contestImageUrl={contest.data.imageUrl}
            photoUrl={replacementPhoto.url}
            photoAlt={replacementPhoto.originalFilename ?? '내 사진'}
            pending={replace.isPending}
            onCancel={() => setReplacementPhoto(null)}
            onConfirm={replaceWithCrop}
          />
        ) : null}
        <ComparisonErrorNotice message={actionErrorMessage} onClose={resetActionErrors} />
      </section>
    </div>
  )
}

function ComparisonViewHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-primary">SAVED COMPARISON</p>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <Button variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function ComparisonActions({
  isPhotoChangePending,
  isDeletePending,
  onChangePhoto,
  onDelete,
}: {
  isPhotoChangePending: boolean
  isDeletePending: boolean
  onChangePhoto: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
      <Button variant="outline" onClick={onChangePhoto} disabled={isPhotoChangePending}>
        사진 변경
      </Button>
      <Button variant="destructive" onClick={onDelete} disabled={isDeletePending}>
        삭제
      </Button>
    </div>
  )
}

function DeleteComparisonDialog({
  isDeleting,
  onClose,
  onDeleteResult,
  onDeletePhoto,
}: {
  isDeleting: boolean
  onClose: () => void
  onDeleteResult: () => void
  onDeletePhoto: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="delete-comparison-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <section
        className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h3 id="delete-comparison-title" className="font-semibold">비교 결과를 삭제할까요?</h3>
          <p className="mt-1 text-sm text-muted-foreground">결과만 지우면 내 사진은 앨범에 남아 있어요.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button variant="outline" size="sm" disabled={isDeleting} onClick={onDeleteResult}>
            결과만 삭제
          </Button>
          <Button variant="destructive" size="sm" disabled={isDeleting} onClick={onDeletePhoto}>
            사진도 삭제
          </Button>
        </div>
      </section>
    </div>
  )
}
