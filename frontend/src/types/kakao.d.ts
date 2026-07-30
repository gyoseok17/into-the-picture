// 카카오 지도 JS SDK 최소 타입 선언.
// 공식 타입 패키지가 없어 우리가 실제 사용하는 표면(마커 표시)만 좁게 선언한다.
// 우리 API 경계(내부 DTO)를 우회하는 any 캐스팅과는 무관 — 외부 글로벌 SDK 격리용.
export {}

declare global {
  interface KakaoLatLng {
    getLat(): number
    getLng(): number
  }

  interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void
    relayout(): void
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void
  }

  interface KakaoMapsNamespace {
    load(callback: () => void): void
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    Map: new (
      container: HTMLElement,
      options: { center: KakaoLatLng; level: number },
    ) => KakaoMap
    Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker
  }

  interface Window {
    kakao?: { maps: KakaoMapsNamespace }
  }
}
