import { KAKAO_JS_KEY } from './env'

const KAKAO_AUTH_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js'
const PENDING_AUTH_KEY = 'into-the-picture.kakao-oauth-pending'

export interface KakaoAuthorizationCallback {
  authorizationCode: string
  returnTo: string
  redirectUri: string
}

interface PendingAuthorization {
  state: string
  returnTo: string
}

let sdkPromise: Promise<KakaoAuthSdk> | null = null

export function kakaoRedirectUri(): string {
  return `${window.location.origin}/login`
}

export function loadKakaoAuthSdk(): Promise<KakaoAuthSdk> {
  if (!KAKAO_JS_KEY) return Promise.reject(new Error('카카오 JavaScript 키가 설정되지 않았습니다.'))
  if (window.Kakao) return Promise.resolve(initialize(window.Kakao))
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<KakaoAuthSdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = KAKAO_AUTH_SDK_URL
    script.async = true
    script.onload = () => window.Kakao ? resolve(initialize(window.Kakao)) : reject(new Error('카카오 로그인 SDK를 불러오지 못했습니다.'))
    script.onerror = () => reject(new Error('카카오 로그인 SDK를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.'))
    document.head.appendChild(script)
  }).catch((error: unknown) => { sdkPromise = null; throw error })
  return sdkPromise
}

/** Starts Kakao's authorization-code redirect. This page reloads on callback. */
export async function startKakaoAuthorization(returnTo: string): Promise<void> {
  const kakao = await loadKakaoAuthSdk()
  if (typeof kakao.Auth?.authorize !== 'function') throw new Error('현재 카카오 로그인 SDK에서 인가 요청을 시작할 수 없습니다.')
  const state = createState()
  sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({ state, returnTo } satisfies PendingAuthorization))
  kakao.Auth.authorize({ redirectUri: kakaoRedirectUri(), state })
}

/** Validates and consumes an authorization callback before it reaches our API. */
export function consumeKakaoAuthorizationCallback(params: URLSearchParams): KakaoAuthorizationCallback | null {
  const authorizationCode = params.get('code')
  if (!authorizationCode) return null
  const pending = readPendingAuthorization()
  const state = params.get('state')
  sessionStorage.removeItem(PENDING_AUTH_KEY)
  if (!pending || !state || !constantTimeEquals(state, pending.state)) {
    throw new Error('카카오 로그인 요청을 확인할 수 없습니다. 다시 로그인해 주세요.')
  }
  return { authorizationCode, returnTo: pending.returnTo, redirectUri: kakaoRedirectUri() }
}

export function kakaoCallbackError(params: URLSearchParams): string | null {
  const error = params.get('error')
  if (!error) return null
  sessionStorage.removeItem(PENDING_AUTH_KEY)
  return params.get('error_description') || `카카오 로그인이 취소되었거나 실패했습니다. (${error})`
}

function initialize(kakao: KakaoAuthSdk): KakaoAuthSdk {
  if (!kakao.isInitialized()) kakao.init(KAKAO_JS_KEY)
  return kakao
}

function createState(): string {
  const values = new Uint8Array(32)
  crypto.getRandomValues(values)
  return btoa(String.fromCharCode(...values)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function readPendingAuthorization(): PendingAuthorization | null {
  const value = sessionStorage.getItem(PENDING_AUTH_KEY)
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null && typeof (parsed as PendingAuthorization).state === 'string' && typeof (parsed as PendingAuthorization).returnTo === 'string') return parsed as PendingAuthorization
  } catch { /* Invalid storage is an invalid callback. */ }
  return null
}

function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return difference === 0
}
