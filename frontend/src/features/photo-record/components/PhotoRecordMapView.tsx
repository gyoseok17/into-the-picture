import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ImagePlus, MapPin, Trophy, X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { useDocumentScrollLock } from '@/hooks/useDocumentScrollLock'
import { getKoreaCity, getKoreaRegion } from '../lib/koreaRegions'
import { getAlbumMapCityPosition } from '../lib/albumMapCityPositions'
import { getAlbumMapMarkerViewport, getAlbumMapRegionViewport, getAlbumMapViewportTransform } from '../lib/albumMapRegionViewport'
import { formatPhotoVisitPeriod } from '../lib/formatPhotoVisitPeriod'
import { useSetPhotoRecordMapRepresentative } from '../hooks/usePhotoRecords'
import type { PhotoRecordBundleMapPin } from '../types'
import { AlbumMapSvg } from './AlbumMapSvg'
import { PhotoComparisonLightboxInfo, PhotoComparisonTrophyBadge } from '@/features/comparison/components/PhotoComparisonLinks'
import type { PhotoComparison } from '@/features/comparison/types'
import { RegionCityPicker, type RegionSelection } from './PhotoRegionField'

interface PinGroup { id: string; left: number; top: number; pins: PhotoRecordBundleMapPin[] }
interface MapStageSize { width: number; height: number }

export function PhotoRecordMapView({ pins, comparisons, unplacedCount: _unplacedCount, immersive = false, onAdd }: { pins: PhotoRecordBundleMapPin[]; comparisons: PhotoComparison[]; unplacedCount: number; immersive?: boolean; onAdd?: (initialLocation: RegionSelection) => void }) {
  const mapViewportRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState<MapStageSize | null>(null)
  const [regionFilter, setRegionFilter] = useState<RegionSelection>({})
  const [focusedGroup, setFocusedGroup] = useState<PinGroup | null>(null)
  const [focusedRecordIndex, setFocusedRecordIndex] = useState(0)
  const filteredPins = useMemo(() => pins.filter((pin) => {
    if (regionFilter.mapRegionCode && !matchesRegion(pin, regionFilter.mapRegionCode)) return false
    if (regionFilter.mapCityCode && pin.mapCityCode !== regionFilter.mapCityCode) return false
    return true
  }), [pins, regionFilter])
  const groups = useMemo(() => groupPins(filteredPins), [filteredPins])
  const region = getKoreaRegion(regionFilter.mapRegionCode)
  const city = getKoreaCity(regionFilter.mapRegionCode, regionFilter.mapCityCode)

  useEffect(() => {
    if (!focusedGroup) return
    const updatedGroup = groups.find((group) => group.id === focusedGroup.id)
    if (!updatedGroup) {
      setFocusedGroup(null)
      setFocusedRecordIndex(0)
      return
    }
    if (updatedGroup !== focusedGroup) setFocusedGroup(updatedGroup)
  }, [focusedGroup, groups])

  const clearSelection = () => {
    setRegionFilter({})
    setFocusedGroup(null)
    setFocusedRecordIndex(0)
  }
  const focusGroup = (group: PinGroup) => {
    setFocusedGroup(group)
    const representativeIndex = group.pins.findIndex((pin) => pin.representative)
    setFocusedRecordIndex(representativeIndex >= 0 ? representativeIndex : 0)
  }
  // A selected marker deliberately takes precedence over its region frame.
  // Closing it restores the selected region viewport; blank/same-region clicks
  // clear both states and return to the full-map frame.
  const mapViewport = focusedGroup
    ? getAlbumMapMarkerViewport(focusedGroup.left, focusedGroup.top)
    : getAlbumMapRegionViewport(regionFilter.mapRegionCode)
  // The helper's percentage translation is derived from the stage's top-left
  // origin. Declare it explicitly instead of relying on CSS's center default.
  const stageStyle = {
    transform: getAlbumMapViewportTransform(mapViewport),
    transformOrigin: '0 0',
  }

  useLayoutEffect(() => {
    const viewport = mapViewportRef.current
    if (!viewport) return

    const updateStageSize = () => {
      const next = getMapStageSize(viewport.clientWidth, viewport.clientHeight)
      setStageSize((current) => current?.width === next.width && current.height === next.height ? current : next)
    }

    updateStageSize()
    const observer = new ResizeObserver(updateStageSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  return <div ref={mapViewportRef} className={`relative overflow-hidden bg-[#f4f8f5] [container-type:size] ${immersive ? 'h-[calc(100dvh-4rem)] min-h-[34rem] rounded-none border-y' : 'h-[calc(100dvh-13rem)] min-h-[32rem] rounded-2xl border shadow-sm'}`}>
    <div className="grid h-full w-full place-items-center">
      {stageSize ? <div className="relative" style={{ width: stageSize.width, height: stageSize.height }}>
      <div className="absolute inset-0 transition-transform duration-500 ease-out" style={stageStyle}>
        <div className="absolute inset-0 z-[1]">
          <AlbumMapSvg
            selectedRegionCode={regionFilter.mapRegionCode}
            onChoose={(mapRegionCode) => {
              if (regionFilter.mapRegionCode === mapRegionCode) clearSelection()
              else {
                setRegionFilter({ mapRegionCode })
                setFocusedGroup(null)
                setFocusedRecordIndex(0)
              }
            }}
            onBlankClick={clearSelection}
            className="h-full max-w-none"
          />
        </div>
        {groups.map((group) => <button key={group.id} type="button" onClick={(event) => { event.stopPropagation(); focusGroup(group) }} className="group absolute z-[2] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ left: `${group.left}%`, top: `${group.top}%` }} aria-label={`${group.pins[0].placeName} 방문 기록 ${group.pins.length}개 보기`}>
          <span className={`grid h-6 min-w-6 place-items-center rounded-full border-2 border-background px-1 text-[10px] font-semibold text-primary-foreground shadow-md transition-transform group-hover:scale-110 ${focusedGroup?.id === group.id ? 'scale-110 bg-primary ring-2 ring-primary/20' : 'bg-primary'}`}>
            {group.pins.length > 1 ? group.pins.length : <MapPin className="h-3 w-3" />}
          </span>
        </button>)}
      </div>
      </div> : null}
    </div>
    {region ? <RegionPicker region={region} selectedCityCode={regionFilter.mapCityCode} onAdd={() => onAdd?.(regionFilter)} onChoose={(mapCityCode) => { setRegionFilter({ mapRegionCode: region.code, mapCityCode }); setFocusedGroup(null); setFocusedRecordIndex(0) }} /> : null}
    {filteredPins.length === 0 ? <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex justify-center"><span className="rounded-full bg-background/90 px-3 py-1.5 text-sm text-muted-foreground shadow-sm">{city && region ? `${region.label} ${city.label}에 표시할 사진이 없어요.` : '표시할 장소가 없어요.'}</span></div> : null}
    {focusedGroup ? <MapFocus group={focusedGroup} comparisons={comparisons} recordIndex={focusedRecordIndex} onRecordIndexChange={setFocusedRecordIndex} onClose={() => { setFocusedGroup(null); setFocusedRecordIndex(0) }} /> : null}
  </div>
}

function getMapStageSize(viewportWidth: number, viewportHeight: number): MapStageSize {
  const width = Math.min(viewportWidth, viewportHeight * (2 / 3))
  return { width, height: width * (3 / 2) }
}

function RegionPicker({ region, selectedCityCode, onChoose, onAdd }: { region: NonNullable<ReturnType<typeof getKoreaRegion>>; selectedCityCode?: string | null; onChoose: (cityCode: string) => void; onAdd?: () => void }) {
  const [isChoosing, setIsChoosing] = useState(false)

  return <div className={`absolute inset-x-3 bottom-3 ${isChoosing ? 'z-30' : 'z-10'} sm:inset-x-auto sm:bottom-4 sm:left-4 sm:right-auto`}>
    <div className="flex items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
      <button type="button" onClick={() => setIsChoosing(true)} className="inline-flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted"><MapPin className="h-4 w-4 text-primary" /><span className="truncate">{selectedCityCode ? region.cities.find((city) => city.code === selectedCityCode)?.label : `${region.label} 지역 선택`}</span></button>
      {onAdd ? <button type="button" onClick={onAdd} disabled={!selectedCityCode} title={selectedCityCode ? undefined : '시·군을 먼저 선택해 주세요.'} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-45"><ImagePlus className="h-4 w-4" />사진 추가</button> : null}
    </div>
    {isChoosing ? <div className="absolute inset-x-0 bottom-0 z-20 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border bg-background p-3 shadow-xl sm:bottom-full sm:top-auto sm:mb-2 sm:max-h-[calc(100cqh-5rem)] sm:overflow-y-auto sm:overscroll-contain" role="dialog" aria-label={`${region.label} 시군 선택`}>
      <div className="mb-3 flex items-center justify-end"><button type="button" onClick={() => setIsChoosing(false)} aria-label="지역 선택 닫기" className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <RegionCityPicker region={region} selectedCityCode={selectedCityCode} onChoose={(cityCode) => { onChoose(cityCode); setIsChoosing(false) }} />
    </div> : null}
  </div>
}

function MapFocus({ group, comparisons, recordIndex, onRecordIndexChange, onClose }: { group: PinGroup; comparisons: PhotoComparison[]; recordIndex: number; onRecordIndexChange: (index: number) => void; onClose: () => void }) {
  const record = group.pins[recordIndex]
  const [photoIndex, setPhotoIndex] = useState(0)
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null)
  const photoTriggerRef = useRef<HTMLButtonElement>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isRepresentative, setIsRepresentative] = useState(record?.representative ?? false)
  const setRepresentative = useSetPhotoRecordMapRepresentative()

  useEffect(() => {
    setPhotoIndex(0)
    setLightboxPhotoIndex(null)
    setIsHistoryOpen(false)
    setIsRepresentative(record?.representative ?? false)
  }, [record?.id, recordIndex])

  if (!record || record.photos.length === 0) return null

  const safePhotoIndex = Math.min(photoIndex, record.photos.length - 1)
  const photo = record.photos[safePhotoIndex]
  const photoComparisons = comparisons.filter((comparison) => comparison.userPhoto.id === photo?.id)
  const hasVisitHistory = group.pins.length > 1
  const hasMultiplePhotos = record.photos.length > 1
  const otherRecords = group.pins
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== recordIndex)
  const movePhoto = (amount: number) => setPhotoIndex((current) => (current + amount + record.photos.length) % record.photos.length)
  const chooseRepresentative = () => {
    const photoRecordId = record.photos[0]?.id
    if (!photoRecordId || isRepresentative || setRepresentative.isPending) return
    setRepresentative.mutate(photoRecordId, { onSuccess: () => setIsRepresentative(true) })
  }

  return <aside className="absolute inset-x-3 bottom-3 z-20 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-80 lg:w-96" onClick={(event) => event.stopPropagation()}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-semibold">{record.placeName}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatPhotoVisitPeriod(record.takenAt, record.endedAt) ?? formatDate(record.takenAt)}
          {hasMultiplePhotos ? ` · 사진 ${safePhotoIndex + 1}/${record.photos.length}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isRepresentative ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">대표</span> : <button type="button" onClick={chooseRepresentative} disabled={setRepresentative.isPending} className="rounded-full border border-primary/25 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60">{setRepresentative.isPending ? '설정 중' : '대표로 설정'}</button>}
        <button type="button" onClick={onClose} aria-label="기록 닫기" className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
    </div>
    {setRepresentative.isError ? <p role="alert" className="mb-2 text-right text-xs text-destructive">대표 기록으로 설정하지 못했어요. 다시 시도해 주세요.</p> : null}
    <div className="relative mt-3 overflow-hidden rounded-xl bg-muted">
      <button ref={photoTriggerRef} type="button" onClick={() => setLightboxPhotoIndex(safePhotoIndex)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label="사진 크게 보기">
        <AspectImage src={photo.url} alt={photo.originalFilename ?? '여행 사진'} ratioClassName="aspect-[4/3]" className="w-full" />
      </button>
      <PhotoComparisonTrophyBadge comparisons={photoComparisons} />
      {hasMultiplePhotos ? <>
        <button type="button" onClick={() => movePhoto(-1)} aria-label="이전 사진" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => movePhoto(1)} aria-label="다음 사진" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow"><ChevronRight className="h-4 w-4" /></button>
      </> : null}
    </div>
    {hasMultiplePhotos ? <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
      {record.photos.map((item, itemIndex) => {
        const hasComparison = comparisons.some((comparison) => comparison.userPhoto.id === item.id)
        return <button key={item.id} type="button" onClick={() => setPhotoIndex(itemIndex)} className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-md border-2 ${itemIndex === photoIndex ? 'border-primary' : 'border-transparent opacity-65'}`} aria-label={`${itemIndex + 1}번째 사진 선택${hasComparison ? ', 수상작 비교 연결됨' : ''}`}>
          <AspectImage src={item.url} alt="" ratioClassName="aspect-square" className="h-full w-full" />
          {hasComparison ? <span className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-primary text-primary-foreground shadow-sm"><Trophy className="h-2 w-2" aria-hidden /><span className="sr-only">수상작 비교 연결됨</span></span> : null}
        </button>
      })}
    </div> : null}
    {hasVisitHistory ? <button type="button" onClick={() => setIsHistoryOpen(true)} className="mt-3 w-full border-t pt-3 text-left text-sm font-medium text-primary hover:underline">이전 방문 기록 {otherRecords.length}건</button> : null}
    {isHistoryOpen ? <VisitHistory records={otherRecords} onChoose={(index) => { onRecordIndexChange(index); setIsHistoryOpen(false) }} onClose={() => setIsHistoryOpen(false)} /> : null}
    {lightboxPhotoIndex != null ? <MapPhotoLightbox photos={record.photos} placeName={record.placeName} comparisons={comparisons} initialIndex={lightboxPhotoIndex} onPhotoChange={setPhotoIndex} onClose={() => { setLightboxPhotoIndex(null); window.requestAnimationFrame(() => photoTriggerRef.current?.focus()) }} /> : null}
  </aside>
}

function MapPhotoLightbox({ photos, placeName, comparisons, initialIndex, onPhotoChange, onClose }: { photos: PhotoRecordBundleMapPin['photos']; placeName: string; comparisons: PhotoComparison[]; initialIndex: number; onPhotoChange: (index: number) => void; onClose: () => void }) {
  const [photoIndex, setPhotoIndex] = useState(initialIndex)
  const photo = photos[photoIndex]
  const photoComparisons = comparisons.filter((comparison) => comparison.userPhoto.id === photo?.id)

  useDocumentScrollLock()

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  if (!photo) return null

  const selectPhoto = (index: number) => {
    setPhotoIndex(index)
    onPhotoChange(index)
  }
  const movePhoto = (amount: number) => {
    const nextIndex = (photoIndex + amount + photos.length) % photos.length
    selectPhoto(nextIndex)
  }

  return createPortal(<div role="dialog" aria-modal aria-label="사진 크게 보기" className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onClick={onClose}>
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{placeName || '장소 정보 없음'}</p>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted">닫기</button>
      </div>
      <div className="overflow-hidden rounded-xl">
        <AspectImage src={photo.url} alt={photo.originalFilename ?? '여행 사진'} ratioClassName="aspect-[4/3]" className="w-full" />
      </div>
      {photoComparisons.length ? <PhotoComparisonLightboxInfo comparisons={photoComparisons} /> : null}
      {photos.length > 1 ? <>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={() => movePhoto(-1)} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">이전</button>
          <span className="text-xs text-muted-foreground">{photoIndex + 1} / {photos.length}</span>
          <button type="button" onClick={() => movePhoto(1)} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">다음</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => selectPhoto(itemIndex)} className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 ${itemIndex === photoIndex ? 'border-primary' : 'border-transparent opacity-70'}`} aria-label={`${itemIndex + 1}번째 사진 보기`}>
            <AspectImage src={item.url} alt="" ratioClassName="aspect-square" className="h-full w-full" />
            {comparisons.some((comparison) => comparison.userPhoto.id === item.id) ? <span className="absolute right-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-primary text-primary-foreground shadow-sm"><Trophy className="h-2 w-2" aria-hidden /><span className="sr-only">비교 연결된 사진</span></span> : null}
          </button>)}
        </div>
      </> : null}
    </section>
  </div>, document.body)
}

function VisitHistory({ records, onChoose, onClose }: { records: Array<{ item: PhotoRecordBundleMapPin; index: number }>; onChoose: (index: number) => void; onClose: () => void }) {
  const setRepresentative = useSetPhotoRecordMapRepresentative()
  const [representativePhotoId, setRepresentativePhotoId] = useState<number | null>(() => records.find(({ item }) => item.representative)?.item.photos[0]?.id ?? null)

  const chooseRepresentative = (item: PhotoRecordBundleMapPin) => {
    const photoRecordId = item.photos[0]?.id
    if (!photoRecordId || representativePhotoId === photoRecordId || setRepresentative.isPending) return
    setRepresentative.mutate(photoRecordId, { onSuccess: () => setRepresentativePhotoId(photoRecordId) })
  }

  return <div className="absolute inset-0 z-30 bg-black/20 sm:bg-transparent" onClick={onClose}>
    <aside role="dialog" aria-modal aria-label="방문 내역" className="absolute inset-x-0 bottom-0 max-h-[78%] overflow-y-auto rounded-t-3xl border bg-background p-4 shadow-2xl sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[25rem] sm:max-h-none sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-semibold">이곳의 기록</h3><p className="mt-0.5 text-xs text-muted-foreground">사진을 누르면 지도에서 해당 기록을 확인합니다.</p></div><button type="button" onClick={onClose} aria-label="방문 내역 닫기" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <div className="space-y-2">
        {records.map(({ item, index }) => {
          const photoRecordId = item.photos[0]?.id
          const representative = item.representative || representativePhotoId === photoRecordId
          return <article key={item.id ?? `legacy-${photoRecordId}`} className="flex items-center gap-3 rounded-xl border p-2.5">
            <button type="button" onClick={() => onChoose(index)} className="min-w-0 flex flex-1 items-center gap-3 text-left"><AspectImage src={item.photos[0]?.url ?? ''} alt="" ratioClassName="aspect-square" className="h-12 w-12 shrink-0 overflow-hidden rounded-lg" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.placeName}</span><span className="mt-0.5 block text-xs text-muted-foreground">{formatPhotoVisitPeriod(item.takenAt, item.endedAt) ?? formatDate(item.takenAt)} · 사진 {item.photos.length}장</span></span></button>
            {representative ? <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">대표</span> : <button type="button" onClick={() => chooseRepresentative(item)} disabled={setRepresentative.isPending} className="shrink-0 rounded-full border border-primary/25 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-60">대표로 설정</button>}
          </article>
        })}
      </div>
      {setRepresentative.isError ? <p role="alert" className="mt-3 text-xs text-destructive">대표 기록으로 설정하지 못했어요. 다시 시도해 주세요.</p> : null}
    </aside>
  </div>
}

function groupPins(pins: PhotoRecordBundleMapPin[]): PinGroup[] {
  const groups = new Map<string, PinGroup>()
  for (const pin of pins) {
    const position = getAlbumMapCityPosition(pin.mapCityCode) ?? toLegacyArtworkPosition(pin.lat, pin.lng)
    // A marker is a visit location, not an arbitrary visual area. City-selected
    // records share their explicit location; older place-only records must have
    // effectively the same coordinates before they share a marker.
    const id = pin.mapRegionCode && pin.mapCityCode
      ? `city-${pin.mapRegionCode}-${pin.mapCityCode}`
      : `place-${pin.lat.toFixed(3)}-${pin.lng.toFixed(3)}`
    const group = groups.get(id)
    if (group) group.pins.push(pin)
    else groups.set(id, { id, ...position, pins: [pin] })
  }
  return [...groups.values()]
}

/** Older records can predate an explicit city selection. They retain a bounded
 * geographic fallback; every current selectable city uses the artwork catalog. */
function toLegacyArtworkPosition(lat: number, lng: number): { left: number; top: number } {
  return { left: clamp(24 + ((lng - 125.8) / (132.1 - 125.8)) * 60, 8, 92), top: clamp(78 - ((lat - 33) / (38.8 - 33)) * 67, 8, 92) }
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)) }

function matchesRegion(pin: Pick<PhotoRecordBundleMapPin, 'mapRegionCode' | 'lat' | 'lng'>, regionCode: string): boolean {
  if (pin.mapRegionCode) return pin.mapRegionCode === regionCode
  const { lat, lng } = pin
  if (regionCode === 'JEJU') return lat < 34.6
  if (regionCode === 'GANGWON') return lat >= 37.2 && lng >= 127.1
  if (regionCode === 'CAPITAL') return lat >= 37 && lng < 127.7
  if (regionCode === 'CHUNGCHEONG') return lat >= 35.7 && lat < 37.2 && lng >= 126.3 && lng < 128.1
  if (regionCode === 'JEOLLA') return lat < 36.2 && lng < 128
  return regionCode === 'GYEONGSANG' && lat < 37.4 && lng >= 127.5
}

function formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) : '촬영일 미상' }
