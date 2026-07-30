// 클라이언트 환경변수 단일 진입점. 컴포넌트가 import.meta.env를 직접 읽지 않게 모은다.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'
export const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY ?? ''

// 카카오 키가 없으면 지도는 graceful 처리('지도 준비중').
export const isKakaoMapEnabled = KAKAO_JS_KEY.length > 0
