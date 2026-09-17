import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, ImagePlus, X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePhotoRecordBundles } from '@/features/photo-record/hooks/usePhotoRecords'
import { extractImageTakenAt } from '@/features/photo-record/lib/extractJpegTakenAt'
import { formatPhotoVisitPeriod } from '@/features/photo-record/lib/formatPhotoVisitPeriod'
import type { PhotoRecordBundle } from '@/features/photo-record/types'
import type { UserPhotoUploadInput } from '../api'
import { getComparisonPhotoDisplay } from '../lib/comparisonPhotoDisplay'
import type { UserPhoto } from '../types'

type PickerStep = 'start' | 'bundles' | 'bundle-photos'

interface PendingPhotoUpload {
  file: File
  previewUrl: string
  takenAt: string
  hasExifTakenAt: boolean
}

interface SelectableBundle {
  key: string
  bundle: PhotoRecordBundle
  photos: UserPhoto[]
}

export function ComparisonPhotoPickerDialog({
  photos,
  bundles: providedBundles,
  unavailablePhotoIds,
  loading,
  uploadPending,
  selectedId,
  onClose,
  onSelect,
  onUpload,
}: {
  photos: UserPhoto[]
  /** Existing active-album data from the caller. When omitted, the dialog loads it on demand. */
  bundles?: PhotoRecordBundle[]
  /** Photos already attached to a saved comparison remain visible but cannot be picked again. */
  unavailablePhotoIds?: ReadonlySet<number>
  loading: boolean
  uploadPending: boolean
  selectedId: number
  onClose: () => void
  onSelect: (id: number) => void
  onUpload: (input: UserPhotoUploadInput) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [step, setStep] = useState<PickerStep>('start')
  const [pickedBundleKey, setPickedBundleKey] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState(selectedId || 0)
  const [pendingUpload, setPendingUpload] = useState<PendingPhotoUpload | null>(null)
  const usesProvidedBundles = providedBundles !== undefined
  const bundlesQuery = usePhotoRecordBundles(false, !usesProvidedBundles && step !== 'start')
  const unavailableIds = unavailablePhotoIds ?? new Set<number>()
  const selectedPhoto = photos.find((photo) => photo.id === pickedId) ?? null
  const selectableBundles = useMemo(
    () => getSelectableBundles(providedBundles ?? bundlesQuery.data ?? [], photos),
    [bundlesQuery.data, photos, providedBundles],
  )
  const pickedBundle = selectableBundles.find((item) => item.key === pickedBundleKey) ?? null

  useEffect(() => () => {
    if (pendingUpload) URL.revokeObjectURL(pendingUpload.previewUrl)
  }, [pendingUpload])

  async function prepareUpload(file: File | undefined): Promise<void> {
    if (!file || uploadPending) return
    const result = await extractImageTakenAt(file).catch(() => ({ status: 'invalid' as const }))
    setPendingUpload((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl)
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        takenAt: result.status === 'found' ? toDateInputValue(result.takenAt) : '',
        hasExifTakenAt: result.status === 'found',
      }
    })
  }

  function confirmUpload(): void {
    if (!pendingUpload || !pendingUpload.takenAt.trim() || uploadPending) return
    onUpload({ file: pendingUpload.file, takenAt: toTakenAtStart(pendingUpload.takenAt) })
  }

  function confirmSelection(): void {
    if (!selectedPhoto || unavailableIds.has(selectedPhoto.id) || uploadPending) return
    onSelect(selectedPhoto.id)
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="내 사진 고르기"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <Card className="w-full max-w-lg overflow-hidden p-0 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <PickerHeader
          step={step}
          onBack={() => {
            if (step === 'bundle-photos') {
              setStep('bundles')
              setPickedId(selectedId || 0)
              return
            }
            setStep('start')
            setPickedBundleKey(null)
            setPickedId(selectedId || 0)
          }}
          onClose={onClose}
        />
        <div className="max-h-[min(68dvh,42rem)] overflow-y-auto p-4">
          <input
            ref={fileInputRef}
            className="sr-only"
            disabled={uploadPending}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void prepareUpload(file)
            }}
          />

          {step === 'start' ? (
            <PickerStart
              hasPhotos={photos.length > 0}
              uploadPending={uploadPending}
              onChooseFile={() => fileInputRef.current?.click()}
              onOpenAlbum={() => setStep('bundles')}
            />
          ) : step === 'bundles' ? (
            <BundleSelection
              bundles={selectableBundles}
              loading={loading || (!usesProvidedBundles && bundlesQuery.isLoading)}
              error={!usesProvidedBundles && bundlesQuery.isError}
              onRetry={() => void bundlesQuery.refetch()}
              onPick={(bundle) => {
                setPickedBundleKey(bundle.key)
                setPickedId(selectedId || 0)
                setStep('bundle-photos')
              }}
            />
          ) : (
            <BundlePhotoSelection
              bundle={pickedBundle}
              selectedPhoto={selectedPhoto}
              unavailablePhotoIds={unavailableIds}
              onPick={setPickedId}
              onConfirm={confirmSelection}
            />
          )}

          {pendingUpload ? (
            <PendingUploadEditor
              pendingUpload={pendingUpload}
              uploadPending={uploadPending}
              onCancel={() => setPendingUpload(null)}
              onTakenAtChange={(takenAt) => setPendingUpload((current) => current ? {
                ...current,
                takenAt,
                hasExifTakenAt: false,
              } : null)}
              onConfirm={confirmUpload}
            />
          ) : null}
        </div>
      </Card>
    </div>
  )
}

function PickerHeader({ step, onBack, onClose }: { step: PickerStep; onBack: () => void; onClose: () => void }) {
  const isAlbumStep = step !== 'start'
  return (
    <div className="flex items-center gap-2 border-b px-4 py-3">
      {isAlbumStep ? (
        <Button type="button" variant="ghost" size="icon" aria-label="처음으로" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">내 사진 고르기</h2>
        <p className="text-xs text-muted-foreground">
          {step === 'bundles' ? '기록 묶음을 먼저 골라요.' : step === 'bundle-photos' ? '이 기록 안에서 사진 한 장을 골라요.' : '새 사진을 추가하거나 앨범에서 골라요.'}
        </p>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function PickerStart({
  hasPhotos,
  uploadPending,
  onChooseFile,
  onOpenAlbum,
}: {
  hasPhotos: boolean
  uploadPending: boolean
  onChooseFile: () => void
  onOpenAlbum: () => void
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={uploadPending}
        onClick={onChooseFile}
        className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-primary/[0.035] px-5 text-center transition-colors hover:bg-primary/[0.07] disabled:cursor-wait disabled:opacity-60"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><ImagePlus className="h-5 w-5" /></span>
        <span className="mt-3 text-sm font-semibold">새 사진 추가</span>
        <span className="mt-1 text-xs text-muted-foreground">사진을 바로 골라 촬영일과 함께 추가해요.</span>
      </button>
      <Button type="button" variant="outline" className="w-full justify-start gap-3 px-4" disabled={!hasPhotos || uploadPending} onClick={onOpenAlbum}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-primary"><CalendarDays className="h-4 w-4" /></span>
        <span className="text-left"><span className="block">앨범에서 고르기</span><span className="block text-xs font-normal text-muted-foreground">기록 묶음을 열고 그 안에서 사진을 골라요.</span></span>
      </Button>
      {!hasPhotos ? <p className="text-center text-xs text-muted-foreground">추가한 사진이 아직 없어요.</p> : null}
    </div>
  )
}

function BundleSelection({
  bundles,
  loading,
  error,
  onRetry,
  onPick,
}: {
  bundles: SelectableBundle[]
  loading: boolean
  error: boolean
  onRetry: () => void
  onPick: (bundle: SelectableBundle) => void
}) {
  return (
    <div className="space-y-4">
      {loading ? <PhotoPickerSkeleton /> : null}
      {!loading && error ? <div className="py-8 text-center"><p className="text-sm text-muted-foreground">기록 묶음을 불러오지 못했어요.</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>다시 시도</Button></div> : null}
      {!loading && !error ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{bundles.map((item) => <BundlePickerItem key={item.key} item={item} onPick={onPick} />)}</div> : null}
      {!loading && !error && !bundles.length ? <p className="py-8 text-center text-sm text-muted-foreground">앨범에 고를 사진이 없어요.</p> : null}
    </div>
  )
}

function BundlePickerItem({ item, onPick }: { item: SelectableBundle; onPick: (bundle: SelectableBundle) => void }) {
  const cover = item.photos[0]
  const placeName = item.bundle.placeName?.trim() || cover?.placeName?.trim() || '장소 미기록'
  const period = formatPhotoVisitPeriod(item.bundle.takenAt, item.bundle.endedAt) ?? formatPhotoDate(cover?.takenAt ?? null) ?? '날짜 미기록'
  return (
    <button type="button" onClick={() => onPick(item)} className="group flex overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      {cover ? <AspectImage src={cover.url} alt="" ratioClassName="aspect-square" className="h-24 w-24 shrink-0 overflow-hidden bg-muted" /> : null}
      <span className="flex min-w-0 flex-1 flex-col justify-center p-3">
        <span className="truncate text-sm font-semibold">{placeName}</span>
        <span className="mt-1 text-xs text-muted-foreground">{period}</span>
        <span className="mt-2 text-xs font-medium text-primary">사진 {item.photos.length}장</span>
      </span>
    </button>
  )
}

function BundlePhotoSelection({ bundle, selectedPhoto, unavailablePhotoIds, onPick, onConfirm }: {
  bundle: SelectableBundle | null
  selectedPhoto: UserPhoto | null
  unavailablePhotoIds: ReadonlySet<number>
  onPick: (id: number) => void
  onConfirm: () => void
}) {
  if (!bundle) return <p className="py-8 text-center text-sm text-muted-foreground">선택한 기록 묶음을 찾을 수 없어요. 뒤로 가서 다시 골라 주세요.</p>
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/60 px-3 py-2"><p className="text-sm font-medium">{bundle.bundle.placeName?.trim() || bundle.photos[0]?.placeName?.trim() || '장소 미기록'}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatPhotoVisitPeriod(bundle.bundle.takenAt, bundle.bundle.endedAt) ?? '날짜 미기록'} · 사진 {bundle.photos.length}장</p></div>
      {selectedPhoto && bundle.photos.some((photo) => photo.id === selectedPhoto.id) && !unavailablePhotoIds.has(selectedPhoto.id) ? <SelectedPhotoSummary photo={selectedPhoto} onConfirm={onConfirm} /> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {bundle.photos.map((photo) => <PhotoPickerItem key={photo.id} photo={photo} isSelected={selectedPhoto?.id === photo.id} unavailable={unavailablePhotoIds.has(photo.id)} onSelect={onPick} />)}
      </div>
    </div>
  )
}

function SelectedPhotoSummary({ photo, onConfirm }: { photo: UserPhoto; onConfirm: () => void }) {
  const display = getComparisonPhotoDisplay(photo)
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl border border-primary/25 bg-card p-2.5 shadow-sm">
      <AspectImage src={photo.url} alt="선택한 사진" ratioClassName="aspect-square" className="h-12 w-12 shrink-0 overflow-hidden rounded-lg" />
      <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">선택한 사진</span><span className="block truncate text-sm font-medium">{display.title}</span>{display.subtitle ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{display.subtitle}</span> : null}</span>
      <Button type="button" size="sm" onClick={onConfirm}>선택</Button>
    </div>
  )
}

function PendingUploadEditor({
  pendingUpload,
  uploadPending,
  onCancel,
  onTakenAtChange,
  onConfirm,
}: {
  pendingUpload: PendingPhotoUpload
  uploadPending: boolean
  onCancel: () => void
  onTakenAtChange: (takenAt: string) => void
  onConfirm: () => void
}) {
  const display = getComparisonPhotoDisplay({ placeName: null, takenAt: pendingUpload.takenAt })
  return (
    <section className="mt-4 rounded-xl border bg-muted/20 p-3" aria-label="새 사진 촬영일 입력">
      <div className="flex gap-3">
        <img src={pendingUpload.previewUrl} alt="새로 선택한 사진 미리보기" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{display.title}</p>
          <label className="mt-2 grid gap-1 text-xs font-medium text-muted-foreground">
            촬영일
            <Input type="date" required aria-label="새 사진 촬영일" value={pendingUpload.takenAt} disabled={uploadPending} onChange={(event) => onTakenAtChange(event.target.value)} />
          </label>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {pendingUpload.hasExifTakenAt ? '사진 정보에서 촬영일을 가져왔어요. 필요하면 바꿀 수 있어요.' : '사진 정보에서 촬영일을 찾지 못했어요. 촬영일을 직접 입력해 주세요.'}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={uploadPending} onClick={onCancel}>취소</Button>
        <Button type="button" size="sm" disabled={!pendingUpload.takenAt.trim() || uploadPending} onClick={onConfirm}>{uploadPending ? '추가 중...' : '사진 추가'}</Button>
      </div>
    </section>
  )
}

function PhotoPickerSkeleton() {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />)}</div>
}

function PhotoPickerItem({ photo, isSelected, unavailable, onSelect }: { photo: UserPhoto; isSelected: boolean; unavailable: boolean; onSelect: (id: number) => void }) {
  const display = getComparisonPhotoDisplay(photo)
  const photoAlt = photo.originalFilename ?? '내 사진'
  return (
    <button type="button" disabled={unavailable} aria-label={unavailable ? `${display.title}, 이미 비교 중이라 선택할 수 없어요` : `${display.title} 선택`} onClick={() => onSelect(photo.id)} className={`group relative overflow-hidden rounded-xl border text-left transition-shadow ${unavailable ? 'cursor-not-allowed opacity-60' : 'hover:shadow-sm'} ${isSelected && !unavailable ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      <AspectImage src={photo.url} alt={photoAlt} ratioClassName="aspect-[4/3]" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8 text-white"><span className="block truncate text-xs font-medium">{display.title}</span>{display.subtitle ? <span className="mt-0.5 block truncate text-[11px] text-white/80">{display.subtitle}</span> : null}</span>
      {isSelected ? <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">선택됨</span> : null}
      {unavailable ? <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[11px] font-medium text-white">비교 중</span> : null}
    </button>
  )
}

function getSelectableBundles(bundles: PhotoRecordBundle[], photos: UserPhoto[]): SelectableBundle[] {
  const selectablePhotos = new Map(photos.map((photo) => [photo.id, photo]))
  return bundles
    .map((bundle) => {
      const bundlePhotos = bundle.photos
        .map((photo) => selectablePhotos.get(photo.id))
        .filter((photo): photo is UserPhoto => Boolean(photo))
      return {
        key: bundle.id ? `bundle-${bundle.id}` : `legacy-${bundle.photos[0]?.id ?? bundle.createdAt}`,
        bundle,
        photos: bundlePhotos,
      }
    })
    .filter((item) => item.photos.length > 0)
    .sort((left, right) => photoMoment(right.bundle).localeCompare(photoMoment(left.bundle)))
}

function photoMoment(bundle: Pick<PhotoRecordBundle, 'takenAt' | 'createdAt'>): string {
  return bundle.takenAt ?? bundle.createdAt
}

function photoDateKey(value: string | null): string {
  const candidate = value?.slice(0, 10)
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : '날짜 미기록'
}

function formatDateGroup(value: string): string {
  if (value === '날짜 미기록') return value
  const [year, month, day] = value.split('-')
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
}

function formatPhotoDate(value: string | null): string | null {
  return value ? formatDateGroup(photoDateKey(value)) : null
}

/** HTML date input uses YYYY-MM-DD; comparison uploads remain LocalDateTime-compatible. */
function toDateInputValue(value: string): string {
  return value.slice(0, 10)
}

function toTakenAtStart(value: string): string {
  return `${toDateInputValue(value)}T00:00:00`
}
