import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import HomePage from '@/pages/HomePage'
import ExplorePage from '@/pages/ExplorePage'
import CrowdPage from '@/pages/CrowdPage'
import MyPage from '@/pages/MyPage'
import AlbumPage from '@/pages/AlbumPage'
import ComparisonManagementPage from '@/features/comparison/pages/ComparisonManagementPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ContestRoute from '@/features/contest/pages/ContestRoute'
import ContestDetailPage from '@/features/contest/pages/ContestDetailPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RouteErrorPage } from '@/components/state/RouteErrorPage'

// 라우트 맵(docs/08). 하단 탭/상단 네비의 to와 정확히 일치해야 한다(QA 대조 포인트).
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/explore', element: <ExplorePage /> },
      {
        path: '/contests',
        element: <ContestRoute />,
        children: [
          { index: true, element: null },
          { path: ':id', element: <ContestDetailPage /> },
        ],
      },
      { path: '/crowd', element: <CrowdPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/me', element: <MyPage /> },
          { path: '/me/favorites', element: <MyPage /> },
          { path: '/me/photos', element: <MyPage /> },
          { path: '/me/album', element: <AlbumPage /> },
          { path: '/me/comparisons', element: <ComparisonManagementPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
