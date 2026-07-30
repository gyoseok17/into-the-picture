import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import ExplorePage from '@/pages/ExplorePage'
import CrowdPage from '@/pages/CrowdPage'
import ComparePage from '@/pages/ComparePage'
import MyPage from '@/pages/MyPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ContestListPage from '@/features/contest/pages/ContestListPage'
import ContestDetailPage from '@/features/contest/pages/ContestDetailPage'

// 라우트 맵(docs/08). 하단 탭/상단 네비의 to와 정확히 일치해야 한다(QA 대조 포인트).
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <ExplorePage /> },
      { path: '/contests', element: <ContestListPage /> },
      { path: '/contests/:id', element: <ContestDetailPage /> },
      { path: '/crowd', element: <CrowdPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/me', element: <MyPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
