import { useEffect } from 'react'
import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/** Last-resort route rendering boundary. Query/API failures remain in each screen's ErrorState. */
export function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  useEffect(() => {
    // Keep the original exception available to developers without exposing it in the UI.
    console.error('Route rendering failed', error)
  }, [error])

  const message = isRouteErrorResponse(error) && error.status === 404
    ? '요청한 화면을 찾을 수 없어요.'
    : '화면을 불러오는 중 문제가 발생했어요.'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-screen-xl items-center justify-center px-4 py-12 md:px-8">
      <section className="flex w-full max-w-md flex-col items-center rounded-3xl border bg-card px-6 py-10 text-center shadow-sm">
        <TriangleAlert className="h-9 w-9 text-destructive" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold">잠시 문제가 생겼어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(0)}>
            <RefreshCw className="h-4 w-4" aria-hidden /> 다시 시도
          </Button>
          <Button type="button" onClick={() => navigate('/') }>
            <Home className="h-4 w-4" aria-hidden /> 홈으로
          </Button>
        </div>
      </section>
    </main>
  )
}
