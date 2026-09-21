import { KAKAO_JS_KEY } from './env'

// The contest map uses MarkerClusterer, so the SDK must be loaded with its
// optional `clusterer` library on the first script request.
const KAKAO_MAPS_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=clusterer`

// Only one script load is in flight at a time. Reset the cached promise after
// an error so a later retry can create a fresh request.
let loadPromise: Promise<void> | null = null

export function loadKakaoMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is unavailable'))
  }
  if (!KAKAO_JS_KEY) {
    return Promise.reject(new Error('VITE_KAKAO_JS_KEY is not configured'))
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const completeAfterMapsLoad = () => {
      const maps = window.kakao?.maps
      if (!maps) {
        loadPromise = null
        reject(new Error('Failed to load Kakao Maps SDK'))
        return
      }

      try {
        maps.load(() => {
          if (!window.kakao?.maps?.MarkerClusterer) {
            loadPromise = null
            reject(
              new Error(
                'Kakao Maps was loaded without the clusterer library',
              ),
            )
            return
          }
          resolve()
        })
      } catch (error) {
        loadPromise = null
        reject(error)
      }
    }

    // autoload=false SDKs expose maps before optional libraries are initialized.
    // Always wait for maps.load() before checking MarkerClusterer.
    if (window.kakao?.maps) {
      completeAfterMapsLoad()
      return
    }

    const script = document.createElement('script')
    script.src = KAKAO_MAPS_SDK_URL
    script.async = true
    script.onload = () => {
      if (!window.kakao?.maps) {
        loadPromise = null
        reject(new Error('Failed to load Kakao Maps SDK'))
        return
      }
      completeAfterMapsLoad()
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Kakao Maps SDK'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

/** Opens Kakao Map directions for a backend-verified keyword place-search ID. */
export function buildKakaoDirectionsUrl(placeId: string): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(placeId)}`
}
