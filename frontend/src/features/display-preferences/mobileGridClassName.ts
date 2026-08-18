import { cn } from '@/lib/utils'

import type { MobileGridColumns } from './hooks/useMobileGridColumns'

const MOBILE_GRID_CLASS_NAMES: Record<MobileGridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}

/**
 * Keeps the shared compact-screen grid preference in one place while each
 * surface remains free to choose its own desktop breakpoints and spacing.
 */
export function mobileGridClassName(
  columns: MobileGridColumns,
  ...classNames: Array<string | undefined>
): string {
  return cn(MOBILE_GRID_CLASS_NAMES[columns], ...classNames)
}
