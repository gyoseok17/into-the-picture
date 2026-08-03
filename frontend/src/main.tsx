import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'

import { router } from './routes/router'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './features/auth/AuthProvider'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
