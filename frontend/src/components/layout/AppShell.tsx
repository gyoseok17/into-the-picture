import { Outlet } from 'react-router-dom'

import { TopNav } from './TopNav'
import { BottomTabBar } from './BottomTabBar'

// 앱 셸: 데스크탑 상단 네비 + 모바일 하단 탭. 가운데 라우트 Outlet.
// 모바일은 하단 탭에 가리지 않게 main 하단 패딩 확보.
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-screen-xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-14 md:pt-9">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
