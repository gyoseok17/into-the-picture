import { QueryClient } from '@tanstack/react-query'

// NFR(09): 외부 의존 호출은 1회 재시도. 캐싱으로 재요청 최소화.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})
