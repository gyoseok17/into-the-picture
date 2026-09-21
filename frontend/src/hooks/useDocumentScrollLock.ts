import { useEffect } from 'react'

let lockCount = 0
let scrollY = 0
let previousStyles: {
  position: string
  top: string
  width: string
  overflow: string
  rootOverflow: string
} | null = null

/** Locks document scrolling while a full-screen detail surface is active. */
export function useDocumentScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return undefined

    const body = document.body.style
    const root = document.documentElement.style
    if (lockCount === 0) {
      scrollY = window.scrollY
      previousStyles = {
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
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount !== 0 || !previousStyles) return

      body.position = previousStyles.position
      body.top = previousStyles.top
      body.width = previousStyles.width
      body.overflow = previousStyles.overflow
      root.overflow = previousStyles.rootOverflow
      window.scrollTo({ top: scrollY, behavior: 'auto' })
      previousStyles = null
    }
  }, [active])
}
