import { KAKAO_JS_KEY } from './env'

// 카카오 지도 JS SDK 로더. autoload=false로 받아 kakao.maps.load 콜백 후 resolve.
// 한 번만 로드(중복 script 방지)되도록 promise를 캐시한다.
let loadPromise: Promise<void> | null = null

export function loadKakaoMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window 없음'))
  }
  if (!KAKAO_JS_KEY) {
    return Promise.reject(new Error('VITE_KAKAO_JS_KEY 미설정'))
  }
  if (window.kakao?.maps) {
    return Promise.resolve()
  }
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      if (!window.kakao?.maps) {
        loadPromise = null
        reject(new Error('카카오 지도 로드 실패'))
        return
      }
      window.kakao.maps.load(() => resolve())
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('카카오 지도 SDK를 불러오지 못했어요'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

// 길안내: 카카오맵 'to' 링크(웹/앱 공통). 좌표 + 도착지명으로 경로 안내 화면을 연다.
export function buildKakaoDirectionsUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
}
