import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { API_BASE } from './env'
import type { ApiErrorBody, AppError } from './api-types'
import { clearSessionHint, getAccessToken, hasSessionHint, setAccessToken } from './tokenStore'
import { notifyAuthExpired } from './authSessionEvents'

export interface AuthUser {
  id: number
  nickname: string
  profileImageUrl: string | null
  email: string | null
}

export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUser
}

export type UserProfile = AuthUser

// 401 재시도 1회 표시용 플래그(any 캐스팅 대신 타입 확장).
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  // NFR(09): 외부 의존 타임아웃. 응답 없으면 빈/에러 상태로.
  timeout: 10_000,
})

// 요청: 메모리의 access 토큰을 Bearer로 첨부.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

// refresh 단일 비행(동시 401이 여러 번 refresh 치지 않게).
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!hasSessionHint()) return null
  try {
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE}/auth/refresh`,
      undefined,
      { withCredentials: true },
    )
    setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    setAccessToken(null)
    clearSessionHint()
    notifyAuthExpired()
    return null
  }
}

// 응답: 401이면 refresh 후 1회 재시도, 그 외/실패는 AppError로 정규화해 throw.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined

    const isAuthEndpoint = original?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null
        })
      }
      const newToken = await refreshing
      if (newToken) {
        const headers = AxiosHeaders.from(original.headers)
        headers.set('Authorization', `Bearer ${newToken}`)
        original.headers = headers
        return apiClient(original)
      }
    }

    return Promise.reject(normalizeError(error))
  },
)

// axios 에러 → 화면이 그대로 표시할 수 있는 AppError로 변환.
// 백엔드 공통 포맷 { error: { code, message } } 우선, 없으면 상태코드로 추론(NFR 429/502 구분).
function normalizeError(error: AxiosError<ApiErrorBody>): AppError {
  const status = error.response?.status
  const body = error.response?.data

  if (body && typeof body === 'object' && 'error' in body && body.error) {
    return { status, code: body.error.code, message: body.error.message }
  }

  if (error.code === 'ECONNABORTED') {
    return { status, code: 'TIMEOUT', message: '요청 시간이 초과되었어요. 잠시 후 다시 시도해주세요.' }
  }

  switch (status) {
    case 401:
      return { status, code: 'UNAUTHORIZED', message: '로그인이 필요해요.' }
    case 403:
      return { status, code: 'FORBIDDEN', message: '접근 권한이 없어요.' }
    case 404:
      return { status, code: 'NOT_FOUND', message: '대상을 찾을 수 없어요.' }
    case 429:
      return { status, code: 'QUOTA_EXCEEDED', message: '요청이 많아요. 잠시 후 다시 시도해주세요.' }
    case 502:
      return { status, code: 'UPSTREAM_ERROR', message: '외부 서비스 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.' }
    default:
      if (status === undefined) {
        return { code: 'NETWORK_ERROR', message: '네트워크 연결을 확인해주세요.' }
      }
      return { status, code: 'UNKNOWN', message: '문제가 발생했어요. 잠시 후 다시 시도해주세요.' }
  }
}

// 타입 가드: TanStack Query의 unknown error를 AppError로 좁힌다.
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  )
}
