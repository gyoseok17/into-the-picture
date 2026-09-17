import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronDown, ImagePlus, MapPin, RotateCcw, Upload, XCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDocumentScrollLock } from '@/hooks/useDocumentScrollLock'
import { uploadPhotoRecordBundle } from '../api'
import { getKoreaCity, getKoreaRegion } from '../lib/koreaRegions'
import { PhotoRegionField } from './PhotoRegionField'
import { extractImageTakenAt, type ImageTakenAtResult } from '../lib/extractJpegTakenAt'
import type { PhotoRecordBundleDraft, PhotoRecordDraft } from '../types'

/** Matches the bundle request limit. The server remains the authority. */
const MAX_SELECTION = 3
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILE_SIZE_LABEL = '10MB'
const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

type ItemStatus = 'ready' | 'uploading' | 'success' | 'failed'

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  takenAt: string | null
  manualTakenAt: string | null
  exif: ImageTakenAtResult['status']
  status: ItemStatus
}

export function BatchPhotoUploadPanel({
  onComplete,
  initialLocation,
  onUploadStateChange,
  showLocationField = false,
}: {
  onComplete: () => void
  initialLocation?: Pick<PhotoRecordDraft, 'mapRegionCode' | 'mapCityCode'>
  onUploadStateChange?: (isUploading: boolean) => void
  /** @deprecated Location is selected through the shared panel overlay. */
  showLocationField?: boolean
}) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const itemRef = useRef<UploadItem[]>([])
  const [items, setItems] = useState<UploadItem[]>([])
  const [common, setCommon] = useState<PhotoRecordBundleDraft>(() => ({
    mapRegionCode: initialLocation?.mapRegionCode ?? null,
    mapCityCode: initialLocation?.mapCityCode ?? null,
    placeName: mapLocationLabel(initialLocation),
  }))
  const [isUploading, setIsUploading] = useState(false)
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null)
  const [isPhotoDateEditorOpen, setIsPhotoDateEditorOpen] = useState(false)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)

  useEffect(() => {
    itemRef.current = items
  }, [items])

  useEffect(() => () => itemRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), [])

  useEffect(() => {
    onUploadStateChange?.(isUploading)
  }, [isUploading, onUploadStateChange])

  const needsCommonTakenAt = !common.takenAt?.trim()
    && items.some((item) => item.exif !== 'found' && !item.manualTakenAt?.trim())
  const hasLocation = Boolean(common.mapRegionCode && common.mapCityCode)
  const hasInvalidVisitPeriod = Boolean(common.endedAt?.trim())
    && (!common.takenAt?.trim() || common.endedAt! < common.takenAt!)

  async function selectFiles(files: FileList | null): Promise<void> {
    if (!files || isUploading) return
    const selected = Array.from(files)
    const oversized = selected.filter((file) => file.size > MAX_FILE_SIZE)
    const valid = selected.filter((file) => file.size <= MAX_FILE_SIZE)
    const limited = valid.slice(0, MAX_SELECTION)
    const notices: string[] = []
    if (oversized.length) notices.push(`${oversized.length}장은 ${MAX_FILE_SIZE_LABEL}를 초과해 제외했어요.`)
    if (valid.length > MAX_SELECTION) notices.push(`한 번에 최대 ${MAX_SELECTION}장까지 추가할 수 있어 처음 ${MAX_SELECTION}장만 골랐어요.`)
    setSelectionNotice(notices.length ? notices.join(' ') : null)

    // Keep the prepared bundle when every new file is rejected.
    if (limited.length === 0) {
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const prepared = await Promise.all(limited.map(prepareItem))
    setItems((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return prepared
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  async function uploadPending(): Promise<void> {
    const targets = items.filter((item) => item.status === 'ready' || item.status === 'failed')
    if (targets.length === 0 || isUploading || needsCommonTakenAt || hasInvalidVisitPeriod || !hasLocation) return
    if (targets.length > MAX_SELECTION || targets.some((item) => item.file.size > MAX_FILE_SIZE)) {
      setSelectionNotice(`사진 묶음은 최대 ${MAX_SELECTION}장, 사진 한 장은 ${MAX_FILE_SIZE_LABEL}까지 올릴 수 있어요.`)
      return
    }
    let uploaded = false
    setIsUploading(true)
    setItems((previous) => previous.map((item) => targets.some((target) => target.id === item.id)
      ? { ...item, status: 'uploading' }
      : item))
    try {
      await uploadPhotoRecordBundle({
        files: targets.map((item) => item.file),
        // A bundle has one common value. Per-file EXIF remains a preview hint
        // until the user explicitly supplies a bundle date.
        takenAt: toManualTakenAt(common.takenAt),
        endedAt: toManualTakenAt(common.endedAt),
        manualTakenAts: manualTakenAtsForUpload(targets),
        placeName: common.placeName?.trim() || null,
        memo: common.memo?.trim() || null,
        mapRegionCode: common.mapRegionCode,
        mapCityCode: common.mapCityCode,
      })
      setItems((previous) => previous.map((item) => targets.some((target) => target.id === item.id)
        ? { ...item, status: 'success' }
        : item))
      uploaded = true
    } catch {
      setItems((previous) => previous.map((item) => targets.some((target) => target.id === item.id)
        ? { ...item, status: 'failed' }
        : item))
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['photo-records'] }),
      queryClient.invalidateQueries({ queryKey: ['photo-record-bundles'] }),
      queryClient.invalidateQueries({ queryKey: ['photo-record-map'] }),
      queryClient.invalidateQueries({ queryKey: ['photo-record-bundle-map'] }),
      queryClient.invalidateQueries({ queryKey: ['user-photos'] }),
      queryClient.invalidateQueries({ queryKey: ['comparisons'] }),
    ])
    setIsUploading(false)
    // Close only after the successful bundle is visible to the album/map queries.
    // A failed request keeps this panel mounted so its items can be retried.
    if (uploaded) onComplete()
  }

  const successCount = items.filter((item) => item.status === 'success').length
  const failedCount = items.filter((item) => item.status === 'failed').length
  const pendingCount = hasLocation
    ? items.filter((item) => item.status === 'ready' || item.status === 'failed').length
    : 0

  return (
    <Card className="space-y-5 border-0 bg-transparent p-0 shadow-none">
      <LocationField value={common} disabled={isUploading} onOpen={() => setIsLocationPickerOpen(true)} />

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="font-medium">사진</h3><p className="mt-0.5 text-xs text-muted-foreground">최대 3장 · 장당 10MB</p></div>
          {items.length ? <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}><ImagePlus className="h-4 w-4" />사진 변경</Button> : null}
        </div>
        <input ref={inputRef} className="sr-only" type="file" multiple accept={ACCEPTED_IMAGES} disabled={isUploading} onChange={(event) => void selectFiles(event.target.files)} />

        {items.length ? <><SelectedPhotos items={items} fallbackTakenAt={common.takenAt} /><button type="button" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60" disabled={isUploading} aria-expanded={isPhotoDateEditorOpen} onClick={() => setIsPhotoDateEditorOpen((current) => !current)}>사진별 날짜 조정<ChevronDown className={`h-4 w-4 transition-transform ${isPhotoDateEditorOpen ? 'rotate-180' : ''}`} /></button>{isPhotoDateEditorOpen ? <PhotoDateAdjustments items={items} fallbackTakenAt={common.takenAt} disabled={isUploading} onChange={(id, manualTakenAt) => setItems((current) => current.map((item) => item.id === id ? { ...item, manualTakenAt } : item))} /> : null}</> : <button type="button" className="mt-4 flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-primary/[0.025] px-5 text-center transition-colors hover:bg-primary/[0.06]" onClick={() => inputRef.current?.click()}><span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><ImagePlus className="h-5 w-5" /></span><span className="mt-3 text-sm font-medium">사진 고르기</span><span className="mt-1 text-xs text-muted-foreground">여행에서 남긴 장면을 골라 주세요</span></button>}
      </section>

      {selectionNotice ? <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{selectionNotice}</p> : null}

      {items.length ? <>
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><div><h3 className="text-sm font-medium">기록 더하기</h3><p className="mt-0.5 text-xs text-muted-foreground">촬영일과 메모는 이번 사진들에 공통으로 적용돼요.</p></div></div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">시작일과 종료일은 이 장소에서 보낸 여행 기간이에요. 사진마다 찾은 촬영일은 그대로 보관돼요.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">시작일<Input type="date" required={needsCommonTakenAt} aria-label="시작일" value={common.takenAt ?? ''} disabled={isUploading} onChange={(event) => setCommon((value) => ({ ...value, takenAt: event.target.value, endedAt: value.endedAt && value.endedAt < event.target.value ? '' : value.endedAt }))} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>종료일 <span className="font-normal">(선택)</span></span><Input type="date" min={common.takenAt ?? undefined} aria-label="종료일" value={common.endedAt ?? ''} disabled={isUploading} onChange={(event) => setCommon((value) => ({ ...value, endedAt: event.target.value }))} /></label>
            {showLocationField ? <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">장소<Input placeholder="장소 (선택)" value={common.placeName ?? ''} disabled={isUploading} onChange={(event) => setCommon((value) => ({ ...value, placeName: event.target.value }))} /></label> : null}
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>메모 <span className="font-normal">(선택)</span></span><Input placeholder="사진에 남길 메모" value={common.memo ?? ''} disabled={isUploading} onChange={(event) => setCommon((value) => ({ ...value, memo: event.target.value }))} /></label>
          </div>
          {!needsCommonTakenAt ? <p className="mt-3 text-xs text-muted-foreground">촬영일을 비워 두면 사진별 정보에서 읽은 날짜를 사용해요.</p> : null}
          {needsCommonTakenAt ? <p role="alert" className="mt-2 text-xs font-medium text-destructive">일부 사진에서 촬영일을 찾지 못했어요. 모든 사진에 적용할 촬영일을 직접 입력해 주세요.</p> : null}
          {hasInvalidVisitPeriod ? <p role="alert" className="mt-2 text-xs font-medium text-destructive">종료일은 시작일보다 빠를 수 없어요. 시작일과 종료일을 확인해 주세요.</p> : null}
        </section>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 py-3 backdrop-blur">
          <p className="text-xs text-muted-foreground" aria-live="polite">{isUploading ? `${successCount}/${items.length}장 저장 중` : failedCount ? `${failedCount}장 저장에 실패했어요.` : successCount === items.length ? `${successCount}장 저장 완료` : `${pendingCount}장 저장 대기`}</p>
          {successCount === items.length ? <Button type="button" size="sm" onClick={onComplete}>완료</Button> : <Button type="button" size="sm" disabled={!pendingCount || isUploading || needsCommonTakenAt || hasInvalidVisitPeriod} onClick={() => void uploadPending()}>{failedCount ? <RotateCcw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}{isUploading ? '묶음 저장 중' : failedCount ? '사진 묶음 다시 저장' : '사진 묶음 저장'}</Button>}
        </div>
      </> : null}
      {isLocationPickerOpen ? <LocationPickerDialog
        value={common}
        disabled={isUploading}
        onClose={() => setIsLocationPickerOpen(false)}
        onChange={(region) => {
          const next = { ...common, ...region }
          setCommon((current) => ({ ...current, ...region, placeName: mapLocationLabel(next) }))
          if (region.mapRegionCode && region.mapCityCode) setIsLocationPickerOpen(false)
        }}
      /> : null}
    </Card>
  )
}

function LocationField({ value, disabled, onOpen }: { value: PhotoRecordBundleDraft; disabled: boolean; onOpen: () => void }) {
  const label = mapLocationLabel(value)
  return (
    <button type="button" disabled={disabled} onClick={onOpen} className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/45 hover:bg-primary/[0.025] disabled:cursor-not-allowed disabled:opacity-60">
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></span>
        <span className="min-w-0"><span className="block text-sm font-medium">장소</span><span className={`mt-0.5 block truncate text-xs ${label ? 'text-muted-foreground' : 'text-destructive'}`}>{label ?? '장소를 선택해 주세요.'}</span></span>
      </span>
      <span className="shrink-0 text-sm font-medium text-primary">{label ? '변경' : '선택'}</span>
    </button>
  )
}

function LocationPickerDialog({ value, onChange, onClose, disabled }: { value: PhotoRecordBundleDraft; onChange: (value: Pick<PhotoRecordDraft, 'mapRegionCode' | 'mapCityCode'>) => void; onClose: () => void; disabled: boolean }) {
  useDocumentScrollLock()
  const close = () => { if (!disabled) onClose() }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || disabled) return
      // This overlay sits above PhotoAddSheet. Handle Escape here so the
      // picker closes without discarding the photo-add form behind it.
      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [disabled, onClose])

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/30 p-3 sm:grid sm:place-items-center" onClick={close}>
      <section role="dialog" aria-modal aria-label="장소 선택" className="absolute inset-x-3 bottom-3 max-h-[88dvh] overflow-y-auto rounded-3xl border bg-background p-4 shadow-2xl sm:static sm:w-full sm:max-w-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4"><h2 className="font-semibold">장소 선택</h2><p className="mt-0.5 text-xs text-muted-foreground">권역과 시·군을 고르면 사진 추가 화면으로 돌아갑니다.</p></div>
        <PhotoRegionField value={value} disabled={disabled} onChange={onChange} />
      </section>
    </div>,
    document.body,
  )
}

export function PhotoAddSheet({ initialLocation, onClose, onComplete }: { initialLocation?: Pick<PhotoRecordDraft, 'mapRegionCode' | 'mapCityCode'>; onClose: () => void; onComplete: () => void }) {
  const [isUploading, setIsUploading] = useState(false)
  useDocumentScrollLock()
  const close = () => { if (!isUploading) onClose() }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isUploading) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isUploading, onClose])

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/25 p-3 sm:grid sm:place-items-center" onClick={close}>
      <section role="dialog" aria-modal aria-label="사진 추가" className="absolute inset-x-3 bottom-3 max-h-[90dvh] overflow-y-auto rounded-3xl border bg-background p-4 shadow-2xl sm:static sm:w-full sm:max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4"><h2 className="font-semibold">사진 추가</h2><p className="mt-0.5 text-xs text-muted-foreground">사진, 촬영일, 장소를 함께 기록해요.</p></div>
        <BatchPhotoUploadPanel initialLocation={initialLocation} onUploadStateChange={setIsUploading} onComplete={onComplete} />
      </section>
    </div>,
    document.body,
  )
}

function SelectedPhotos({ items, fallbackTakenAt }: { items: UploadItem[]; fallbackTakenAt?: string | null }) {
  const visible = items.slice(0, 6)
  const remaining = items.length - visible.length
  return <div className="mt-4"><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{visible.map((item, index) => <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted"><img src={item.previewUrl} alt={`${index + 1}번째 선택 사진`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/65 to-transparent px-2 pb-1.5 pt-5 text-[11px] text-white"><UploadState status={item.status} inverse /><span>{takenAtLabel(item, fallbackTakenAt)}</span></div></div>)}</div>{remaining > 0 ? <p className="mt-2 text-xs text-muted-foreground">사진 {remaining}장이 더 선택되어 있어요.</p> : null}</div>
}

function PhotoDateAdjustments({ items, fallbackTakenAt, disabled, onChange }: { items: UploadItem[]; fallbackTakenAt?: string | null; disabled: boolean; onChange: (id: string, takenAt: string | null) => void }) {
  return <div className="mt-3 space-y-2 rounded-xl border bg-muted/30 p-3"><p className="text-xs leading-5 text-muted-foreground">사진 정보에서 찾은 촬영일은 그대로 사용해요. 직접 지정한 날짜만 해당 사진에 적용되고, 날짜가 없는 사진은 여행 시작일을 사용해요.</p>{items.map((item, index) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-3 rounded-lg bg-background px-2.5 py-2"><div className="min-w-0"><p className="truncate text-xs font-medium">{index + 1}. {item.file.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{itemDateSourceLabel(item, fallbackTakenAt)}</p></div><Input type="date" aria-label={`${index + 1}번째 사진 촬영일 직접 지정`} value={item.manualTakenAt ?? ''} disabled={disabled} onChange={(event) => onChange(item.id, event.target.value || null)} /></div>)}</div>
}

async function prepareItem(file: File): Promise<UploadItem> {
  try {
    const exif = await extractImageTakenAt(file)
    return { id: `${file.name}-${file.lastModified}-${file.size}`, file, previewUrl: URL.createObjectURL(file), takenAt: exif.status === 'found' ? exif.takenAt : null, manualTakenAt: null, exif: exif.status, status: 'ready' }
  } catch {
    return { id: `${file.name}-${file.lastModified}-${file.size}`, file, previewUrl: URL.createObjectURL(file), takenAt: null, manualTakenAt: null, exif: 'invalid', status: 'ready' }
  }
}

function toManualTakenAt(value: string | null | undefined): string | null { return value?.trim() ? `${value}T00:00:00` : null }

/**
 * `manualTakenAts` is an optional multipart field. Sending a list made only of
 * empty values can be normalized away by multipart binders, which breaks the
 * server's 1:1 file/date contract. Omit it entirely unless the user supplied
 * at least one per-photo override; the API serializer preserves automatic
 * positional slots with its reserved multipart value.
 */
function manualTakenAtsForUpload(items: UploadItem[]): Array<string | null> | undefined {
  const values = items.map((item) => toManualTakenAt(item.manualTakenAt))
  return values.some((value) => value !== null) ? values : undefined
}

export function SelectedMapLocation({ value }: { value: PhotoRecordDraft }) {
  const label = mapLocationLabel(value) ?? '지역 미선택'
  return <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-sm font-medium text-primary"><MapPin className="h-4 w-4" />{label}</div>
}

function mapLocationLabel(value: Pick<PhotoRecordDraft, 'mapRegionCode' | 'mapCityCode'> | undefined): string | null {
  const region = getKoreaRegion(value?.mapRegionCode)
  const city = getKoreaCity(value?.mapRegionCode, value?.mapCityCode)
  return region && city ? `${region.label} · ${city.label}` : null
}

function UploadState({ status, inverse = false }: { status: ItemStatus; inverse?: boolean }) {
  if (status === 'success') return <Check className={`h-4 w-4 shrink-0 ${inverse ? 'text-emerald-300' : 'text-emerald-600'}`} />
  if (status === 'failed') return <XCircle className={`h-4 w-4 shrink-0 ${inverse ? 'text-red-300' : 'text-destructive'}`} />
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status === 'uploading' ? 'animate-pulse bg-primary' : inverse ? 'bg-white/80' : 'bg-muted-foreground/40'}`} />
}

function takenAtLabel(item: UploadItem, fallbackTakenAt?: string | null): string {
  const takenAt = item.manualTakenAt || item.takenAt || fallbackTakenAt
  if (takenAt) return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short' }).format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(takenAt) ? `${takenAt}T00:00:00` : takenAt))
  return item.exif === 'not-supported' ? '날짜 직접 입력' : '촬영일 없음'
}

function itemDateSourceLabel(item: UploadItem, fallbackTakenAt?: string | null): string {
  if (item.manualTakenAt) return `직접 지정 · ${takenAtLabel(item)}`
  if (item.takenAt) return `사진 정보 · ${takenAtLabel(item)}`
  if (fallbackTakenAt) return `여행 시작일 사용 · ${takenAtLabel(item, fallbackTakenAt)}`
  return '촬영일을 직접 지정하거나 여행 시작일을 입력해 주세요.'
}
