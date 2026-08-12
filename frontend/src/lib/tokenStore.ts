import { Preferences } from '@capacitor/preferences'

// 토큰 보관 정책(05-auth):
// - access: 메모리(휘발) — XSS 노출 최소화
// - refresh: Capacitor Preferences(앱=보안저장소, 웹=localStorage 폴백)
// 인증 도메인(D1)은 후속 마일스톤. 여기서는 apiClient 인터셉터가 쓸 seam만 둔다.

const REFRESH_KEY = 'itp.refreshToken'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

/** Removes a refresh token left by the pre-HttpOnly-cookie implementation. */
export async function clearLegacyRefreshToken(): Promise<void> {
  await Preferences.remove({ key: REFRESH_KEY })
}

/** A non-sensitive cookie hint avoids a refresh call for known logged-out visitors. */
export function hasSessionHint(): boolean {
  return typeof document !== 'undefined' && document.cookie.split('; ').includes('itp_session=1')
}

/** refresh가 거절되면 다음 페이지 진입에서 불필요한 재시도를 막는다. */
export function clearSessionHint(): void {
  if (typeof document !== 'undefined') document.cookie = 'itp_session=; Path=/; Max-Age=0; SameSite=Lax'
}
