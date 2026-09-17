import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Camera,
  ImagePlus,
  Map as MapIcon,
  Plus,
  Trophy,
  X,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { AspectImage } from '@/components/AspectImage'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { LoadingState } from '@/components/state/LoadingState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDocumentScrollLock } from '@/hooks/useDocumentScrollLock'
import { isAppError } from '@/lib/apiClient'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  usePhotoRecordBundles,
  useDeletePhotoRecord,
  useDeletePhotoRecordBundle,
  usePhotoRecordBundleMap,
  useUpdatePhotoRecord,
} from '../hooks/usePhotoRecords'
import { PhotoRecordMapView } from './PhotoRecordMapView'
import { PhotoRecordStoryTimeline } from './PhotoRecordStoryTimeline'
import { PhotoRecordBundleCard, StoryComparisonMarker } from './PhotoRecordBundleCard'
import { PhotoAddSheet } from './BatchPhotoUploadPanel'
import { AlbumComparisonPicker } from './AlbumComparisonPicker'
import { PhotoComparisonLightboxInfo } from '@/features/comparison/components/PhotoComparisonLinks'
import { useComparisons } from '@/features/comparison/hooks/useComparison'
import type { PhotoComparison } from '@/features/comparison/types'
import {
  bundleKey,
  groupBundles,
  normalizeDraft,
  toDateTimeInput,
} from '../lib/photoRecordAlbumPresentation'
import type {
  PhotoDisplayMode,
  PhotoRecord,
  PhotoRecordDraft,
  PhotoRecordBundle,
} from '../types'

function getConnectedPhotoCount(
  bundle: PhotoRecordBundle,
  comparisonsByPhotoId: Map<number, PhotoComparison[]>,
) {
  return bundle.photos.filter((photo) => (comparisonsByPhotoId.get(photo.id)?.length ?? 0) > 0).length
}

export function PhotoRecordAlbum({ immersive = false }: { immersive?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const comparisonContestId = Number(searchParams.get('contestId')) || 0
  const [view, setView] = useState<AlbumView>('active')
  const [layout, setLayout] = useState<AlbumLayout>('story')
  const [photoAddRequest, setPhotoAddRequest] = useState<{ initialLocation?: Pick<PhotoRecordDraft, 'mapRegionCode' | 'mapCityCode'> } | null>(null)
  const isAdding = photoAddRequest !== null
  const bundles = usePhotoRecordBundles(view === 'archive')
  const comparisons = useComparisons()
  const map = usePhotoRecordBundleMap(view === 'active' && layout === 'map')
  const update = useUpdatePhotoRecord()
  const remove = useDeletePhotoRecord()
  const removeBundle = useDeletePhotoRecordBundle()
  const [editing, setEditing] = useState<PhotoRecord | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => new Set())
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState<string | null>(null)
  const [storyPreview, setStoryPreview] = useState<PhotoRecordBundle | null>(null)

  const comparisonsByPhotoId = useMemo(() => {
    const indexed = new Map<number, PhotoComparison[]>()
    for (const comparison of comparisons.data ?? []) {
      const connected = indexed.get(comparison.userPhoto.id) ?? []
      connected.push(comparison)
      indexed.set(comparison.userPhoto.id, connected)
    }
    return indexed
  }, [comparisons.data])

  const pickerExistingComparison = comparisons.data?.find(
    (comparison) => comparison.contest.id === comparisonContestId,
  )

  useEffect(() => {
    if (comparisonContestId && pickerExistingComparison) {
      navigate(`/compare?contestId=${comparisonContestId}`, { replace: true })
    }
  }, [comparisonContestId, navigate, pickerExistingComparison])

  function closeComparisonPicker(): void {
    const next = new URLSearchParams(searchParams)
    next.delete('contestId')
    setSearchParams(next, { replace: true })
  }

  const groupedBundles = useMemo(
    () => groupBundles(bundles.data ?? [], 'time'),
    [bundles.data],
  )

  const toggleSelected = (key: string) => setSelectedItems((current) => {
    const next = new Set(current)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const deleteSelected = async () => {
    if (!selectedItems.size || !window.confirm(`${selectedItems.size}개 기록을 삭제할까요? 비교에 사용 중인 사진이 포함되면 해당 기록은 유지됩니다.`)) return
    const selected = (bundles.data ?? []).filter((bundle) => selectedItems.has(bundleKey(bundle)))
    const deletedKeys = new Set<string>()
    let conflicts = 0
    let failures = 0

    for (const bundle of selected) {
      try {
        if (bundle.id) await removeBundle.mutateAsync(bundle.id)
        else await remove.mutateAsync(bundle.photos[0].id)
        deletedKeys.add(bundleKey(bundle))
      } catch (error) {
        if (isAppError(error) && (error.status === 409 || error.code === 'CONFLICT')) conflicts += 1
        else failures += 1
      }
    }

    setSelectedItems((current) => new Set([...current].filter((key) => !deletedKeys.has(key))))
    setBulkDeleteMessage(bulkDeleteResultMessage(deletedKeys.size, conflicts, failures))
    // Keep management open when anything was retained or failed so the user can
    // resolve it. A fully successful deletion needs no extra "complete" action.
    if (selected.length > 0 && deletedKeys.size === selected.length) {
      setIsManaging(false)
    }
    // The result is summarized above, so clear the last mutation error rather
    // than showing a generic error that hides which records were retained.
    remove.reset()
    removeBundle.reset()
  }

  const immersiveMap = immersive && view === 'active' && layout === 'map'
  const immersiveStory = immersive && view === 'active' && layout === 'story'
  const sectionClass = immersive
    ? `relative left-1/2 w-screen -translate-x-1/2 -mt-6 min-h-[calc(100dvh-4rem)] bg-[#f4f8f5] md:-mt-9 ${immersiveMap ? '' : `space-y-5 px-4 pb-10 ${immersiveStory ? 'pt-16' : 'pt-20'} md:px-8`}`
    : 'space-y-4'

  return (
    <>
    <section className={sectionClass}>
      <AlbumHeaderV2
        view={view}
        layout={layout}
        isAdding={isAdding}
        compact={immersive}
        onArchiveToggle={() => {
          setView((current) => current === 'active' ? 'archive' : 'active')
          setLayout('story')
          setPhotoAddRequest(null)
        }}
        onLayoutChange={setLayout}
        onAddToggle={() => setPhotoAddRequest((current) => current ? null : {})}
        isManaging={isManaging}
        onManageToggle={() => { setIsManaging((current) => !current); setSelectedItems(new Set()) }}
      />
      {bundles.isPending ? (
        <LoadingState label="내 사진 기록을 불러오는 중…" />
      ) : null}
      {bundles.isError ? (
        <ErrorState
          error={bundles.error}
          onRetry={() => void bundles.refetch()}
        />
      ) : null}
      {view === 'active' && layout === 'map' && map.isPending ? <LoadingState label="사진의 장소를 지도에 준비하는 중이에요." /> : null}
      {view === 'active' && layout === 'map' && map.isError ? <ErrorState error={map.error} onRetry={() => void map.refetch()} /> : null}
      {!bundles.isPending && !bundles.isError && !(view === 'active' && layout === 'map') && groupedBundles.length === 0 ? (
        <EmptyState
          title={
            view === 'archive'
              ? '보관한 사진이 없어요'
              : '아직 남긴 사진이 없어요'
          }
          description={
            view === 'archive'
              ? '사진을 다시 꺼내면 여기에서 관리할 수 있어요.'
              : '여행에서 남긴 장면을 바로 추가해 보세요.'
          }
        />
      ) : null}
      {view === 'active' && layout === 'map' && !map.isPending && !map.isError ? <PhotoRecordMapView pins={map.data ?? []} comparisons={comparisons.data ?? []} unplacedCount={Math.max(0, (bundles.data ?? []).reduce((count, bundle) => count + bundle.photos.length, 0) - (map.data ?? []).reduce((count, pin) => count + pin.photos.length, 0))} immersive={immersiveMap} onAdd={(initialLocation) => setPhotoAddRequest({ initialLocation })} /> : null}
      {isManaging && selectedItems.size ? <div className="sticky top-3 z-30 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur"><span className="text-sm font-medium">{selectedItems.size}개 선택</span><Button size="sm" variant="destructive" disabled={remove.isPending || removeBundle.isPending} onClick={() => void deleteSelected()}>선택 삭제</Button></div> : null}
      {bulkDeleteMessage ? <div role="status" className="mx-auto max-w-6xl rounded-xl border bg-background/95 px-3 py-2 text-sm shadow-sm"><div className="flex items-center justify-between gap-3"><span>{bulkDeleteMessage}</span><Button type="button" variant="ghost" size="sm" onClick={() => setBulkDeleteMessage(null)}>닫기</Button></div></div> : null}
        {view === 'active' && layout === 'story' ? (
          <PhotoRecordStoryTimeline
            groups={groupedBundles}
            immersive={immersive}
            renderBundle={(bundle) => (
              <>
                {bundle.photos.length > 1 ? <span aria-hidden className="pointer-events-none absolute inset-1 z-0 bg-white shadow-[0_3px_10px_rgba(40,55,48,0.08)] rotate-[-1.1deg] translate-x-2 translate-y-2" /> : null}
                {bundle.photos.length > 2 ? <span aria-hidden className="pointer-events-none absolute inset-1 z-0 bg-white shadow-[0_3px_10px_rgba(40,55,48,0.06)] rotate-[1deg] -translate-x-2 translate-y-4" /> : null}
                <StoryComparisonMarker connectedPhotoCount={getConnectedPhotoCount(bundle, comparisonsByPhotoId)} />
                <div className="relative z-10 bg-white p-2 pb-6 shadow-[0_4px_14px_rgba(40,55,48,0.10)]">
                  <PhotoRecordBundleCard
                    bundle={bundle}
                    archived={false}
                    updating={update.isPending}
                    selecting={isManaging}
                    selected={selectedItems.has(bundleKey(bundle))}
                    onSelect={() => toggleSelected(bundleKey(bundle))}
                    onEdit={() => bundle.legacy && setEditing(bundle.photos[0])}
                    onArchive={() => bundle.legacy && update.mutate({ id: bundle.photos[0].id, update: { archived: true } })}
                    onRestore={() => update.mutate({ id: bundle.photos[0].id, update: { archived: false } })}
                    onOpen={() => !isManaging && setStoryPreview(bundle)}
                    comparisonsByPhotoId={comparisonsByPhotoId}
                    storyOnly
                  />
                </div>
              </>
            )}
          />
        ) : null}
      {view === 'archive' ? <div className={immersive ? 'mx-auto max-w-6xl space-y-8' : 'space-y-7'}>
        {groupedBundles.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <h3 className="font-medium text-foreground">{group.label}</h3>
              <span>{group.bundles.reduce((count, bundle) => count + bundle.photos.length, 0)}장</span>
            </div>
            <div className={immersive ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-2 gap-3 sm:grid-cols-3'}>
              {group.bundles.map((bundle) => (
                <PhotoRecordBundleCard
                  key={bundleKey(bundle)}
                  bundle={bundle}
                  archived={view === 'archive'}
                  updating={update.isPending}
                  selecting={isManaging}
                  selected={selectedItems.has(bundleKey(bundle))}
                  onSelect={() => toggleSelected(bundleKey(bundle))}
                  onEdit={() => bundle.legacy && setEditing(bundle.photos[0])}
                  onArchive={() =>
                    bundle.legacy && update.mutate({ id: bundle.photos[0].id, update: { archived: true } })
                  }
                  onRestore={() =>
                    update.mutate({
                      id: bundle.photos[0].id,
                      update: { archived: false },
                    })
                  }
                  comparisonsByPhotoId={comparisonsByPhotoId}
                />
              ))}
            </div>
          </section>
        ))}
      </div> : null}
      {update.isError || remove.isError || removeBundle.isError ? (
        <AlbumError
          message={
            remove.isError || removeBundle.isError
              ? deleteErrorMessage(remove.error ?? removeBundle.error)
              : '사진 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
          }
          onClose={() => {
            update.reset()
            remove.reset()
            removeBundle.reset()
          }}
        />
      ) : null}
    </section>
    {storyPreview ? <PhotoBundleLightbox bundle={storyPreview} comparisonsByPhotoId={comparisonsByPhotoId} onClose={() => setStoryPreview(null)} /> : null}
    {editing ? (
      <PhotoRecordEditor
        record={editing}
        pending={update.isPending}
        deleting={remove.isPending}
        onClose={() => setEditing(null)}
        onSave={(draft) =>
          update.mutate(
            { id: editing.id, update: draft },
            { onSuccess: () => setEditing(null) },
          )
        }
        onDelete={() => remove.mutate(editing.id, { onSuccess: () => setEditing(null) })}
      />
    ) : null}
    {comparisonContestId && !pickerExistingComparison ? <AlbumComparisonPicker contestId={comparisonContestId} bundles={bundles.data ?? []} onClose={closeComparisonPicker} /> : null}
    {view === 'active' && layout === 'story' && !isManaging ? <Button type="button" size="icon" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 h-9 w-9 rounded-full shadow-lg md:bottom-6 md:right-6" onClick={() => setPhotoAddRequest({})} aria-label="사진 추가" title="사진 추가"><Plus className="h-4 w-4" /><span className="sr-only">사진 추가</span></Button> : null}
    {view === 'archive' ? <Button type="button" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 rounded-full shadow-lg md:bottom-6 md:right-6" onClick={() => setPhotoAddRequest({})}><ImagePlus className="h-4 w-4" />사진 추가</Button> : null}
    {photoAddRequest ? <PhotoAddSheet initialLocation={photoAddRequest.initialLocation} onClose={() => setPhotoAddRequest(null)} onComplete={() => setPhotoAddRequest(null)} /> : null}
    </>
  )
}

function AlbumHeaderV2({
  view,
  layout,
  isAdding,
  compact,
  isManaging,
  onArchiveToggle,
  onLayoutChange,
  onAddToggle,
  onManageToggle,
}: {
  view: AlbumView
  layout: AlbumLayout
  isAdding: boolean
  compact: boolean
  onArchiveToggle: () => void
  onLayoutChange: (layout: AlbumLayout) => void
  onAddToggle: () => void
  isManaging: boolean
  onManageToggle: () => void
}) {
  return (
    <div className={compact ? 'absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2' : 'flex flex-wrap items-end justify-between gap-3'}>
      {compact ? <Button asChild type="button" variant="secondary" size="icon" className="rounded-full bg-background/90 shadow-sm backdrop-blur" aria-label="마이로 돌아가기"><Link to="/me"><ArrowLeft className="h-4 w-4" /></Link></Button> : <div>
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Camera className="h-4 w-4 text-primary" /> {view === 'archive' ? '보관함' : '내 앨범'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {view === 'archive' ? '잠시 보관한 사진을 다시 꺼내거나 정리할 수 있어요.' : '사진을 시간의 흐름과 장소의 기억으로 살펴보세요.'}
        </p>
      </div>}
      <div className={`flex min-w-0 flex-nowrap items-center justify-end gap-2 ${compact ? 'rounded-full bg-background/90 p-1 shadow-sm backdrop-blur' : ''}`}>
        {view === 'active' ? (
          <div className="inline-flex rounded-full bg-muted p-1 text-sm" aria-label="앨범 보기 방식">
            <button type="button" onClick={() => onLayoutChange('story')} className={`rounded-full px-3 py-1.5 transition-colors ${layout === 'story' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              스토리
            </button>
            <button type="button" onClick={() => onLayoutChange('map')} className={`rounded-full px-3 py-1.5 transition-colors ${layout === 'map' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <MapIcon className="mr-1 inline h-3.5 w-3.5" />맵
            </button>
          </div>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={onArchiveToggle}>
          <Archive className="h-4 w-4" />
          {view === 'archive' ? '앨범으로' : '보관함'}
        </Button>
        {view === 'active' && layout === 'story' ? <Button type="button" variant="outline" size="sm" onClick={onManageToggle}>{isManaging ? '완료' : '관리'}</Button> : null}
        {view === 'active' && layout !== 'map' && layout !== 'story' ? <Button type="button" size="sm" onClick={onAddToggle}><ImagePlus className="h-4 w-4" />{isAdding ? '닫기' : '사진 추가'}</Button> : null}
      </div>
    </div>
  )
}

function PhotoBundleLightbox({
  bundle,
  comparisonsByPhotoId,
  onClose,
}: {
  bundle: PhotoRecordBundle
  comparisonsByPhotoId: Map<number, PhotoComparison[]>
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const photo = bundle.photos[index]
  const photoComparisons = photo ? comparisonsByPhotoId.get(photo.id) ?? [] : []

  useDocumentScrollLock()

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  if (!photo) return null

  const move = (offset: number) => {
    setIndex((current) => (current + offset + bundle.photos.length) % bundle.photos.length)
  }

  return (
    <div role="dialog" aria-modal aria-label="사진 묶음 보기" className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <section className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{bundle.placeName || unknownPlace}</p>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>닫기</Button>
        </div>
        <div className="overflow-hidden rounded-xl">
          <AspectImage src={photo.url} alt={photo.originalFilename ?? '여행 사진'} ratioClassName="aspect-[4/3]" className="w-full" />
        </div>
        {photoComparisons.length ? <PhotoComparisonLightboxInfo comparisons={photoComparisons} /> : null}
        {bundle.photos.length > 1 ? (
          <>
            <div className="mt-3 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => move(-1)}>이전</Button>
              <span className="text-xs text-muted-foreground">{index + 1} / {bundle.photos.length}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => move(1)}>다음</Button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {bundle.photos.map((item, itemIndex) => (
                <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 ${itemIndex === index ? 'border-primary' : 'border-transparent opacity-70'}`}>
                  <AspectImage src={item.url} alt="" ratioClassName="aspect-square" className="h-full w-full" />
                  {(comparisonsByPhotoId.get(item.id)?.length ?? 0) > 0 ? <span className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-primary text-primary-foreground shadow-sm"><Trophy className="h-2 w-2" aria-hidden /><span className="sr-only">비교 연결된 사진</span></span> : null}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

function PhotoRecordEditor({
  record,
  pending,
  deleting,
  onClose,
  onSave,
  onDelete,
}: {
  record: PhotoRecord
  pending: boolean
  deleting: boolean
  onClose: () => void
  onSave: (draft: PhotoRecordDraft & { displayMode?: PhotoDisplayMode }) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<PhotoRecordDraft>({
    takenAt: record.takenAt,
    placeName: record.placeName,
    memo: record.memo,
  })
  const [displayMode, setDisplayMode] = useState<PhotoDisplayMode>(
    record.displayMode,
  )
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  useDocumentScrollLock()

  useEffect(() => {
    closeButton.current?.focus()
  }, [])
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="photo-record-editor-title"
      className="fixed inset-0 z-[70] flex items-end bg-black/45 p-3 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <Card
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="photo-record-editor-title" className="font-semibold">
              사진 기록 수정
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              비어 있는 값은 ‘미상’으로 표시돼요.
            </p>
          </div>
          <Button
            ref={closeButton}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="닫기"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AspectImage
          src={record.url}
          alt={record.originalFilename ?? '내 사진'}
          className="mt-4 rounded-lg"
          ratioClassName="aspect-[4/3]"
        />
        <div className="mt-4 space-y-3">
          <label className="space-y-1 text-sm font-medium">
            촬영일
            <Input
              type="datetime-local"
              value={toDateTimeInput(draft.takenAt)}
              onChange={(event) =>
                setDraft((value) => ({ ...value, takenAt: event.target.value }))
              }
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            장소
            <Input
              placeholder="장소 미상"
              value={draft.placeName ?? ''}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  placeName: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            메모
            <textarea
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="남기고 싶은 이야기를 적어 보세요."
              value={draft.memo ?? ''}
              onChange={(event) =>
                setDraft((value) => ({ ...value, memo: event.target.value }))
              }
            />
          </label>
          {record.contestId ? (
            <label className="space-y-1 text-sm font-medium">
              비교 장면 표시
              <Select
                value={displayMode}
                onValueChange={(value: PhotoDisplayMode) =>
                  setDisplayMode(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITH_CONTEST">
                    수상작과 함께 보기
                  </SelectItem>
                  <SelectItem value="PHOTO_ONLY">내 사진만 보기</SelectItem>
                </SelectContent>
              </Select>
            </label>
          ) : null}
        </div>
        {isDeleteConfirming ? (
          <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium">이 사진을 삭제할까요?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              사진 기록과 원본 파일을 함께 지웁니다. 비교에 사용 중인 사진은
              먼저 비교 결과를 삭제해야 해요.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => setIsDeleteConfirming(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? '삭제 중…' : '사진 삭제'}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteConfirming(true)}
            disabled={pending || deleting}
          >
            사진 삭제
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending || deleting}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() =>
                onSave({
                  ...normalizeDraft(draft),
                  ...(record.contestId ? { displayMode } : {}),
                })
              }
              disabled={pending || deleting}
            >
              {pending ? '저장 중…' : '저장'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AlbumError({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return createPortal(
    <div
      role="alert"
      className="fixed inset-x-4 bottom-5 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background p-3 shadow-lg"
    >
      <p className="flex-1 text-sm">{message}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>,
    document.body,
  )
}

function deleteErrorMessage(error: unknown): string {
  if (
    isAppError(error) &&
    (error.status === 409 || error.code === 'CONFLICT')
  ) {
    return '비교 결과에 사용 중인 사진은 삭제할 수 없어요. 비교 화면에서 결과를 먼저 삭제해 주세요.'
  }
  return '사진을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

function bulkDeleteResultMessage(deleted: number, conflicts: number, failures: number): string {
  const parts = [`${deleted}개 삭제 완료`]
  if (conflicts) parts.push(`비교에 사용 중인 ${conflicts}개는 유지됨`)
  if (failures) parts.push(`${failures}개 삭제 실패`)
  return parts.join(' · ')
}

type AlbumView = 'active' | 'archive'
type AlbumLayout = 'story' | 'map'

const unknownPlace = '장소 미상'
