// 모든 도메인이 공유하는 API 공통 래퍼 타입(docs/04 · api-shapes 시드).
// 도메인별 DTO는 각 feature의 types.ts에 둔다.

// 목록 공통 페이지 응답
export interface Page<T> {
  content: T[]
  page: {
    page: number
    size: number
    totalCount: number
    hasNext: boolean
  }
}

// 백엔드 공통 에러 바디: { error: { code, message } }
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

// 프론트 전역에서 다루는 정규화된 에러(상태표시/재시도용).
// apiClient가 axios 에러를 이 형태로 변환해 throw → ErrorState가 표시.
export interface AppError {
  status?: number
  code: string
  message: string
}
