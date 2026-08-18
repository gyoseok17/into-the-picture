import { Outlet, useLocation } from 'react-router-dom'

import ContestListPage from './ContestListPage'

/**
 * Keeps the list mounted when a card opens its detail. The detail URL remains
 * shareable; only a list-originated entry uses the overlay presentation.
 */
export default function ContestRoute() {
  const location = useLocation()
  const isDetailRoute = location.pathname !== '/contests'
  const openedFromContestList = location.state?.contestListEntry === true

  if (isDetailRoute && !openedFromContestList) return <Outlet />

  return (
    <>
      <ContestListPage />
      <Outlet />
    </>
  )
}
