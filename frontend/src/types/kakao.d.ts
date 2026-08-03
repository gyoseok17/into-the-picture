// Narrow declarations for the Kakao Maps JS SDK surface used by this app.
// Kakao does not publish a first-party TypeScript package.
export {}

declare global {
  interface KakaoLatLng {
    getLat(): number
    getLng(): number
  }

  interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void
    setBounds(bounds: KakaoLatLngBounds): void
    relayout(): void
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void
    getPosition(): KakaoLatLng
  }

  interface KakaoLatLngBounds {
    extend(latlng: KakaoLatLng): void
  }

  interface KakaoMarkerCluster {
    getMarkers(): KakaoMarker[]
    getCenter(): KakaoLatLng
    getBounds(): KakaoLatLngBounds
    getSize(): number
    getText(): string
  }

  interface KakaoMarkerClusterer {
    addMarker(marker: KakaoMarker, nodraw?: boolean): void
    addMarkers(markers: KakaoMarker[], nodraw?: boolean): void
    clear(): void
    removeMarker(marker: KakaoMarker, nodraw?: boolean): void
    removeMarkers(markers: KakaoMarker[], nodraw?: boolean): void
    redraw(): void
    setMap(map: KakaoMap | null): void
  }

  interface KakaoMarkerClustererOptions {
    map?: KakaoMap
    averageCenter?: boolean
    minLevel?: number
    minClusterSize?: number
    disableClickZoom?: boolean
    gridSize?: number
    calculator?: number[] | ((size: number) => number)
    texts?: string[] | ((size: number) => string)
    styles?: Array<Record<string, string | number>>
  }

  interface KakaoMapEvent {
    addListener(
      target: KakaoMarkerClusterer,
      type: 'clusterclick',
      handler: (cluster: KakaoMarkerCluster) => void,
    ): void
    addListener(
      target: KakaoMap | KakaoMarker | KakaoMarkerClusterer,
      type: string,
      handler: (...args: unknown[]) => void,
    ): void
    removeListener(
      target: KakaoMarkerClusterer,
      type: 'clusterclick',
      handler: (cluster: KakaoMarkerCluster) => void,
    ): void
    removeListener(
      target: KakaoMap | KakaoMarker | KakaoMarkerClusterer,
      type: string,
      handler: (...args: unknown[]) => void,
    ): void
  }

  interface KakaoMapsNamespace {
    load(callback: () => void): void
    event: KakaoMapEvent
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    LatLngBounds: new () => KakaoLatLngBounds
    Map: new (
      container: HTMLElement,
      options: { center: KakaoLatLng; level: number },
    ) => KakaoMap
    Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker
    MarkerClusterer: new (options: KakaoMarkerClustererOptions) => KakaoMarkerClusterer
  }

  interface KakaoAuthSdk {
    isInitialized(): boolean
    init(key: string): void
    Auth: {
      authorize(options: { redirectUri: string; state: string }): void
    }
  }

  interface Window {
    kakao?: { maps: KakaoMapsNamespace }
    Kakao?: KakaoAuthSdk
  }
}
