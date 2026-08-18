import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUp, Menu, Search, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ScrollAssistProps {
  action: 'search' | 'filters'
  children: (close: () => void) => ReactNode
}

const actionCopy = {
  search: { label: '검색 열기', icon: Search },
  filters: { label: '필터 열기', icon: SlidersHorizontal },
} as const

/** Long result pages share viewport controls while keeping page-specific edits in place. */
export function ScrollAssist({ action, children }: ScrollAssistProps) {
  const [visible, setVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 480)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  const closePanel = () => {
    setPanelOpen(false)
    window.setTimeout(() => menuTriggerRef.current?.focus({ preventScroll: true }), 0)
  }

  const closeMenu = () => {
    setMenuOpen(false)
    window.setTimeout(() => menuTriggerRef.current?.focus({ preventScroll: true }), 0)
  }

  useEffect(() => {
    if (!panelOpen) return
    dialogRef.current?.querySelector<HTMLElement>('input, button, select, [tabindex]:not([tabindex="-1"])')?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [panelOpen])

  useEffect(() => {
    if (!menuOpen && !panelOpen) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node
      // Radix Select renders options in a portal. Do not treat choosing one as an
      // outside click, or the staged quick-filter draft would be discarded.
      if (target instanceof Element && target.closest('[data-radix-popper-content-wrapper]')) {
        return
      }
      if (!dialogRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        if (panelOpen) closePanel()
        else closeMenu()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [menuOpen, panelOpen])

  useEffect(() => {
    if (!menuOpen || panelOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen, panelOpen])

  useEffect(() => {
    if (!menuOpen || panelOpen) return
    menuRef.current?.querySelector<HTMLButtonElement>('#scroll-assist-actions button')?.focus({ preventScroll: true })
  }, [menuOpen, panelOpen])

  useEffect(() => {
    if (!visible) {
      setMenuOpen(false)
      setPanelOpen(false)
    }
  }, [visible])

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const openPanel = () => {
    setMenuOpen(false)
    setPanelOpen(true)
  }

  const ActionIcon = actionCopy[action].icon
  if (!visible) return null

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-2 md:bottom-6 md:right-6" role="group" aria-label="결과 빠른 도구">
      {panelOpen ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label={actionCopy[action].label}
          tabIndex={-1}
          className={action === 'search'
            ? 'w-[min(20rem,calc(100vw-2rem))] rounded-full border bg-background/95 p-1 shadow-md backdrop-blur outline-none'
            : 'w-[min(23rem,calc(100vw-2rem))] rounded-[1.4rem] border border-primary/10 bg-background/95 p-2 shadow-xl backdrop-blur outline-none'}
        >
          {children(closePanel)}
        </div>
      ) : null}
      {!panelOpen ? <div ref={menuRef} className={menuOpen ? 'flex items-center [&>button]:hidden' : 'flex items-center'}>
        {menuOpen ? (
          <div id="scroll-assist-actions" role="group" aria-label="결과 빠른 도구" className="flex h-11 items-center divide-x overflow-hidden rounded-full border bg-background/95 shadow-md backdrop-blur [&>button]:h-11 [&>button]:w-11 [&>button]:shrink-0 [&>button]:!rounded-none [&>button]:!bg-transparent [&>button]:!shadow-none">
            <Button type="button" variant="secondary" size="icon" className="h-11 w-11 rounded-full bg-background/95 shadow-md backdrop-blur" onClick={() => { setMenuOpen(false); scrollToTop() }} aria-label="페이지 맨 위로 이동">
              <ArrowUp className="h-5 w-5" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="h-11 w-11 rounded-full bg-background/95 shadow-md backdrop-blur" onClick={openPanel} aria-label={actionCopy[action].label}>
              <ActionIcon className="h-5 w-5" />
            </Button>
          </div>
        ) : null}
        <Button ref={menuTriggerRef} type="button" variant="secondary" size="icon" className="h-11 w-11 rounded-full bg-background/95 shadow-md backdrop-blur" onClick={() => setMenuOpen((current) => !current)} aria-label="결과 빠른 도구" aria-expanded={menuOpen} aria-controls="scroll-assist-actions">
          <Menu className="h-5 w-5" />
        </Button>
      </div> : null}
    </div>
  )
}
