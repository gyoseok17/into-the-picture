import { useEffect, useState } from 'react'

export type MobileGridColumns = 1 | 2 | 3

const STORAGE_KEY = 'into-the-picture:mobile-grid-columns'
const DEFAULT_COLUMNS: MobileGridColumns = 2

function readColumns(): MobileGridColumns {
  if (typeof window === 'undefined') return DEFAULT_COLUMNS

  try {
    const storedColumns = window.localStorage.getItem(STORAGE_KEY)
    return storedColumns === '1' || storedColumns === '2' || storedColumns === '3'
      ? Number(storedColumns) as MobileGridColumns
      : DEFAULT_COLUMNS
  } catch {
    return DEFAULT_COLUMNS
  }
}

/**
 * Keeps the compact-screen result layout consistent between contest and photo search.
 * Storage failures deliberately fall back to the two-column default.
 */
export function useMobileGridColumns() {
  const [columns, setColumns] = useState<MobileGridColumns>(readColumns)

  useEffect(() => {
    const syncColumns = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setColumns(readColumns())
    }

    window.addEventListener('storage', syncColumns)
    return () => window.removeEventListener('storage', syncColumns)
  }, [])

  const updateColumns = (nextColumns: MobileGridColumns) => {
    setColumns(nextColumns)

    try {
      window.localStorage.setItem(STORAGE_KEY, String(nextColumns))
    } catch {
      // Keep the current tab usable when storage is unavailable.
    }
  }

  return [columns, updateColumns] as const
}
