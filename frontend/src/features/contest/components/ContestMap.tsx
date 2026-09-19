import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isKakaoMapEnabled } from '@/lib/env'
import { buildKakaoDirectionsUrl, loadKakaoMaps } from '@/lib/kakaoMap'

interface ContestMapProps {
  destinationName: string
  lat: number | null
  lng: number | null
}

// 카카오 지도(JS SDK) 마커 + 길안내. 키 미설정/좌표 null이면 graceful 처리(앱 안 죽게).
export function ContestMap({ destinationName, lat, lng }: ContestMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mapFailed, setMapFailed] = useState(false)

  const hasCoords = lat != null && lng != null
  const canRenderMap = isKakaoMapEnabled && hasCoords && !mapFailed
  const directionsUrl =
    lat != null && lng != null ? buildKakaoDirectionsUrl(destinationName, lat, lng) : null

  useEffect(() => {
    if (!isKakaoMapEnabled || lat == null || lng == null) return

    let cancelled = false
    loadKakaoMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao) return
        const center = new window.kakao.maps.LatLng(lat, lng)
        const map = new window.kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
        })
        new window.kakao.maps.Marker({ position: center, map })
        // 컨테이너가 늦게 보이는 경우 대비.
        map.relayout()
        map.setCenter(center)
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [lat, lng])

  return (
    <div className="space-y-2">
      {canRenderMap ? (
        <div
          ref={containerRef}
          className="aspect-[16/10] w-full overflow-hidden rounded-lg border"
        />
      ) : (
        <MapPlaceholder reason={hasCoords ? '지도 준비중' : '위치 정보 준비중'} />
      )}

      {directionsUrl ? (
        <Button asChild variant="outline" className="w-full">
          <a href={directionsUrl} target="_blank" rel="noreferrer">
            <Navigation /> 길안내
          </a>
        </Button>
      ) : null}
    </div>
  )
}

function MapPlaceholder({ reason }: { reason: string }) {
  return (
    <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
      <MapPin className="h-6 w-6" />
      <p className="text-sm">{reason}</p>
    </div>
  )
}
