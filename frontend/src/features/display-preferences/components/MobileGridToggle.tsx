import { Columns2, Columns3, Rows3 } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { MobileGridColumns } from '../hooks/useMobileGridColumns'

export function MobileGridToggle({
  value,
  onChange,
}: {
  value: MobileGridColumns
  onChange: (columns: MobileGridColumns) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-border/80 bg-background p-0.5 sm:hidden" aria-label="사진 표시 수">
      <GridButton active={value === 1} label="사진 한 줄씩 보기" onClick={() => onChange(1)}>
        <Rows3 className="h-4 w-4" /> 1열
      </GridButton>
      <GridButton active={value === 2} label="사진 두 개씩 보기" onClick={() => onChange(2)}>
        <Columns2 className="h-4 w-4" /> 2열
      </GridButton>
      <GridButton active={value === 3} label="사진 세 개씩 보기" onClick={() => onChange(3)}>
        <Columns3 className="h-4 w-4" /> 3열
      </GridButton>
    </div>
  )
}

function GridButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
