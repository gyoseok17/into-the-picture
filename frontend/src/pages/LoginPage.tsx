import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { KAKAO_JS_KEY } from '@/lib/env'
import { consumeKakaoAuthorizationCallback, kakaoCallbackError, loadKakaoAuthSdk, startKakaoAuthorization } from '@/lib/kakaoAuth'
import { isAppError } from '@/lib/apiClient'
import { useAuth } from '@/features/auth/AuthProvider'

function safeReturnTo(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function errorMessage(caught: unknown): string {
  return isAppError(caught) ? caught.message : caught instanceof Error ? caught.message : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

// StrictMode remounts a page in development; submit each callback only once.
const submittedCallbackCodes = new Set<string>()

export default function LoginPage() {
  const { user, isBootstrapping, loginWithKakaoCode } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [isSdkReady, setIsSdkReady] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callbackStarted = useRef(false)
  const returnTo = safeReturnTo(params.get('returnTo'))

  useEffect(() => {
    const providerError = kakaoCallbackError(params)
    if (providerError) { setError(providerError); return }
    // StrictMode의 두 번째 마운트는 첫 번째 마운트가 state를 소비한 뒤에 실행된다.
    // 이미 제출한 인가 코드는 다시 state 검증을 하지 않아 잘못된 실패 문구를 막는다.
    const callbackCode = params.get('code')
    if (callbackCode && submittedCallbackCodes.has(callbackCode)) return
    let callback
    try { callback = consumeKakaoAuthorizationCallback(params) } catch (caught) { setError(errorMessage(caught)); return }
    if (!callback || callbackStarted.current || submittedCallbackCodes.has(callback.authorizationCode)) return

    callbackStarted.current = true
    submittedCallbackCodes.add(callback.authorizationCode)
    setIsLoggingIn(true)
    void loginWithKakaoCode(callback.authorizationCode, callback.redirectUri)
      .then(() => navigate(callback.returnTo, { replace: true }))
      .catch((caught: unknown) => { submittedCallbackCodes.delete(callback.authorizationCode); setError(errorMessage(caught)) })
      .finally(() => setIsLoggingIn(false))
  }, [loginWithKakaoCode, navigate, params])

  useEffect(() => {
    if (!KAKAO_JS_KEY) { setError('카카오 로그인이 설정되지 않았습니다. 관리자에게 문의해 주세요.'); return }
    loadKakaoAuthSdk().then(() => setIsSdkReady(true)).catch((caught: unknown) => setError(errorMessage(caught)))
  }, [])

  // 카카오 콜백 URL에는 returnTo가 없으므로, code 처리 중에는 아래 자동 이동을 막는다.
  // 콜백 effect가 sessionStorage에 보관한 원래 주소로 이동한다.
  if (!isBootstrapping && user && !params.get('code')) return <Navigate to={returnTo} replace />

  async function handleLogin(): Promise<void> {
    setError(null)
    setIsLoggingIn(true)
    try { await startKakaoAuthorization(returnTo) } catch (caught) { setError(errorMessage(caught)); setIsLoggingIn(false) }
  }

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">로그인</h1>
        <p className="text-sm text-muted-foreground">카카오 계정으로 Into the Picture를 계속 이용하세요.</p>
      </div>
      <Button className="h-12 w-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90" disabled={!isSdkReady || isLoggingIn || !KAKAO_JS_KEY} onClick={() => void handleLogin()}>
        <MessageCircle className="h-5 w-5 fill-current" />
        {isLoggingIn ? '로그인 중...' : isSdkReady ? '카카오로 로그인' : '카카오 로그인 준비 중...'}
      </Button>
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    </section>
  )
}
