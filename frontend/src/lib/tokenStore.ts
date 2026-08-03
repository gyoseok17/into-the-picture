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
