import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, X } from 'lucide-react'

import { AspectImage } from '@/components/AspectImage'
import { Badge } from '@/components/ui/badge'
import { isKakaoMapEnabled } from '@/lib/env'
import { loadKakaoMaps } from '@/lib/kakaoMap'
import type { ContestMapPin } from '../types'

interface ContestMapViewProps {
  pins: ContestMapPin[]
}

const FALLBACK_CENTER = { lat: 37.5666805, lng: 126.9784147 }

export function ContestMapView({ pins }: ContestMapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<KakaoMap | null>(null)
  const clustererRef = useRef<KakaoMarkerClusterer | null>(null)
  const markersRef = useRef<KakaoMarker[]>([])
  const markerPinsRef = useRef(new Map<KakaoMarker, ContestMapPin>())
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [selectedPins, setSelectedPins] = useState<ContestMapPin[]>([])

  const canRenderMap = isKakaoMapEnabled && !mapFailed

  // Create the map once. Markers and their clusterer are managed independently
  // so filtering does not recreate the Kakao map instance.
  useEffect(() => {
    if (!isKakaoMapEnabled) return

    let cancelled = false
    let createdMap: KakaoMap | null = null
    let createdClusterer: KakaoMarkerClusterer | null = null
    let clearSelection: (() => void) | null = null
    let selectClusterPins: ((cluster: KakaoMarkerCluster) => void) | null = null
    loadKakaoMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao) return

        const kakao = window.kakao
        const center = new kakao.maps.LatLng(
          FALLBACK_CENTER.lat,
          FALLBACK_CENTER.lng,
        )
        const map = new kakao.maps.Map(containerRef.current, {
          center,
          level: 9,
        })
        const clusterer = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 6,
          disableClickZoom: true,
        })

        clearSelection = () => setSelectedPins([])
        selectClusterPins = (cluster) => {
          const clusterPins = cluster
            .getMarkers()
            .map((marker) => markerPinsRef.current.get(marker))
            .filter((pin): pin is ContestMapPin => pin != null)
          setSelectedPins(clusterPins)
        }
        kakao.maps.event.addListener(map, 'zoom_changed', clearSelection)
        kakao.maps.event.addListener(map, 'dragend', clearSelection)
        kakao.maps.event.addListener(clusterer, 'clusterclick', selectClusterPins)

        map.relayout()
        map.setCenter(center)
        createdMap = map
        createdClusterer = clusterer
        mapRef.current = map
        clustererRef.current = clusterer
        setMapReady(true)
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true)
      })

    return () => {
      cancelled = true
      if (window.kakao && createdMap && clearSelection) {
        window.kakao.maps.event.removeListener(
          createdMap,
          'zoom_changed',
          clearSelection,
        )
        window.kakao.maps.event.removeListener(
          createdMap,
          'dragend',
          clearSelection,
        )
      }
      if (window.kakao && createdClusterer && selectClusterPins) {
        window.kakao.maps.event.removeListener(
          createdClusterer,
          'clusterclick',
          selectClusterPins,
        )
      }
      clustererRef.current?.clear()
      clustererRef.current?.setMap(null)
      clustererRef.current = null
      markersRef.current = []
      markerPinsRef.current.clear()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Replace the displayed marker set when filters change. A selection from the
  // old set must never remain visible in the side panel.
  useEffect(() => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!mapReady || !map || !clusterer || !window.kakao) return

    const kakao = window.kakao
    setSelectedPins([])
    clusterer.clear()
    markersRef.current = []
    markerPinsRef.current.clear()

    if (pins.length === 0) return

    const bounds = new kakao.maps.LatLngBounds()
    const markers = pins.map((pin) => {
      const position = new kakao.maps.LatLng(pin.lat, pin.lng)
      const marker = new kakao.maps.Marker({ position })
      markerPinsRef.current.set(marker, pin)
      bounds.extend(position)
      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedPins([pin])
      })
      return marker
    })

    markersRef.current = markers
    clusterer.addMarkers(markers)
    if (pins.length === 1) {
      map.setCenter(new kakao.maps.LatLng(pins[0].lat, pins[0].lng))
    } else {
      map.setBounds(bounds)
    }

    return () => {
      clusterer.clear()
      markersRef.current = []
      markerPinsRef.current.clear()
    }
  }, [pins, mapReady])

  if (!canRenderMap) {
    return (
      <div className="space-y-2">
        <MapCount count={pins.length} />
        <MapPlaceholder reason="지도 준비중" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <MapCount count={pins.length} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-stretch">
        <div className="relative min-w-0">
          <div
            ref={containerRef}
            className="aspect-[3/4] w-full overflow-hidden rounded-lg border sm:aspect-[16/10] lg:h-full lg:min-h-[34rem] lg:aspect-auto"
          />
          {pins.length === 0 ? (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center">
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                지도에 표시할 위치 정보가 없어요
              </span>
            </div>
          ) : null}
        </div>

        <MapSelectionPanel
          pins={selectedPins}
          onClose={() => setSelectedPins([])}
        />
      </div>
    </div>
  )
}

function MapCount({ count }: { count: number }) {
  return (
    <p className="text-sm text-muted-foreground">
      지도에 표시된 <span className="font-medium text-foreground">수상작 {count}개</span>
    </p>
  )
}

function MapSelectionPanel({
  pins,
  onClose,
}: {
  pins: ContestMapPin[]
  onClose: () => void
}) {
  const navigate = useNavigate()
  const hasSelection = pins.length > 0

  return (
    <aside
      aria-live="polite"
      className="min-h-40 rounded-lg border bg-card p-4 lg:min-h-[34rem]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">선택한 수상작</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSelection
              ? `${pins.length}개 작품을 보고 있어요`
              : '지도 핀 또는 숫자 마커를 선택해 보세요'}
          </p>
        </div>
        {hasSelection ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="선택한 수상작 닫기"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {hasSelection ? (
        <div className="mt-4 space-y-3 lg:max-h-[30rem] lg:overflow-y-auto lg:pr-1">
          {pins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => navigate(`/contests/${pin.id}`)}
              className="flex w-full gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AspectImage
                src={pin.thumbUrl}
                alt={pin.title}
                ratioClassName="aspect-square"
                className="h-24 w-24 shrink-0 rounded-md sm:h-28 sm:w-28"
              />
              <div className="min-w-0 flex-1 space-y-2 py-1">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{pin.awardGrade}</Badge>
                  {pin.sido ? <Badge variant="outline">{pin.sido}</Badge> : null}
                </div>
                <h3 className="line-clamp-2 font-semibold leading-snug">{pin.title}</h3>
                <p className="text-sm text-muted-foreground">작품 상세 보기</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-h-24 items-center justify-center text-center text-sm text-muted-foreground lg:min-h-[26rem]">
          <MapPin className="mr-2 h-5 w-5 shrink-0" />
          겹친 수상작은 숫자 마커를 누르면 함께 볼 수 있어요.
        </div>
      )}
    </aside>
  )
}

function MapPlaceholder({ reason }: { reason: string }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground sm:aspect-[16/10]">
      <MapPin className="h-6 w-6" />
      <p className="text-sm">{reason}</p>
    </div>
  )
}
