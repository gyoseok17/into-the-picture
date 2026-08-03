import { apiClient, type AuthResponse, type UserProfile } from '@/lib/apiClient'

export async function loginWithKakao(authorizationCode: string, redirectUri: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/kakao', { authorizationCode, redirectUri })
  return data
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me')
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
