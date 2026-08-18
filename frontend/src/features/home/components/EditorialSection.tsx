import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EditorialSectionProps {
  id?: string
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** 사진 중심 화면에서 반복되는 느슨한 섹션 골격. */
export function EditorialSection({ id, eyebrow, title, description, action, children, className }: EditorialSectionProps) {
  return (
    <section id={id} className={cn('space-y-5 scroll-mt-24', className)}>
      <header className="flex items-end justify-between gap-4">
        <div className="max-w-xl space-y-1.5">
          {eyebrow ? <p className="text-xs font-medium tracking-[0.16em] text-primary/65">{eyebrow}</p> : null}
          <h2 className="font-editorial text-2xl leading-tight tracking-[-0.03em] text-foreground sm:text-3xl">{title}</h2>
          {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
