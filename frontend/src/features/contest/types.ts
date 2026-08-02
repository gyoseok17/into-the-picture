// 공모전(contest) 도메인 응답 타입 — backend 확정본 그대로.
// 출처: _workspace/api-shapes/M1_backend_contest-shapes.md (docs/04 계약을 백엔드가 확정).
// 외부 필드명(galWebImageUrl·koTitle…) 노출 금지: 모두 내부 DTO.
// 백엔드 실제 shape와 다르면 any/제네릭으로 우회하지 말고 backend-engineer와 합의(QA 경계면).

// GET /contests content[]
export interface ContestSummary {
  id: number
  title: string
  thumbUrl: string // https 치환됨
  location: string // "경상남도 합천군, 가야산국립공원"
  sido: string | null // "경상남도" (location 파싱 실패 시 null)
  sigungu: string | null // "합천군" (location 파싱 실패 시 null)
  photographer: string
  filmMonth: string // "202401" (YYYYMM)
  awardDivision: string // "스마트폰 부문"
  awardGrade: string // "입선"
  season: string | null // "겨울" | null (없으면 빈문자열 아닌 null)
  keywords: string[] // keywordsRaw 콤마 분리·트림 (없으면 [])
}

// GET /contests/{id} — 요약 + 좌표/원본
export interface ContestDetail extends ContestSummary {
  imageUrl: string // 원본, https 치환됨
  lat: number | null // 지오코딩 결과(없으면 null)
  lng: number | null
  copyright: string // "Type1"
  crowdAvailable: boolean // true면 프론트가 /crowd 호출
}

// GET /contests/map 항목 — 지도 뷰 다중 마커용.
// 페이지네이션 없이 필터 걸린 작품 전체 배열. lat/lng 둘 다 non-null 보장(좌표 없는 건 응답 제외).
// 출처: _workspace/contracts/M1.1_lead_contest-mapview.md.
export interface ContestMapPin {
  id: number
  title: string
  thumbUrl: string // https 치환됨 (미리보기 카드 썸네일)
  lat: number // non-null 보장
  lng: number
  awardGrade: string // 미리보기 뱃지용
  sido: string | null // 미리보기 보조 표기
}

// GET /contests/filters — UI 구성용
export interface FilterOptions {
  seasons: string[]
  grades: string[]
  divisions: string[]
  sidos: string[]
}

// 집중률 일별 항목. date 포맷은 "YYYY-MM-DD"(목록 filmMonth=YYYYMM과 상이, 캐스팅 금지).
export interface CrowdDaily {
  date: string
  rate: number
}

// GET /contests/{id}/crowd — 매칭 시 200, 없으면 204(→ api에서 null)
export interface CrowdForecast {
  attractionName: string // "가야산국립공원(홍류동,청량동지구)"
  areaNm: string // "경상남도"
  sigunguNm: string // "합천군"
  matchType: 'EXACT' | 'PARTIAL'
  daily: CrowdDaily[] // 30일
  recommendedDates: string[] // 혼잡도 낮은 추천일(백엔드 계산)
}

// GET /contests 쿼리 파라미터(모두 선택). page/size는 훅이 주입.
export interface ContestQuery {
  season?: string
  grade?: string
  division?: string
  sido?: string
  keyword?: string
  sort?: string
}
