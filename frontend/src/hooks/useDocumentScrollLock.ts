import { useEffect } from 'react'

/** Locks document scrolling while a full-screen detail surface is active. */
export function useDocumentScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return undefined

    const scrollY = window.scrollY
    const body = document.body.style
    const root = document.documentElement.style
    const previous = {
      position: body.position,
      top: body.top,
      width: body.width,
      overflow: body.overflow,
      rootOverflow: root.overflow,
    }

    body.position = 'fixed'
    body.top = `-${scrollY}px`
    body.width = '100%'
    body.overflow = 'hidden'
    root.overflow = 'hidden'

    return () => {
      body.position = previous.position
      body.top = previous.top
      body.width = previous.width
      body.overflow = previous.overflow
      root.overflow = previous.rootOverflow
      window.scrollTo({ top: scrollY, behavior: 'auto' })
    }
  }, [active])
}
