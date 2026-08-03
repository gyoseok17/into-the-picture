type AuthExpiredListener = () => void

const listeners = new Set<AuthExpiredListener>()

// apiClient and the React provider deliberately communicate through this tiny
// event seam, keeping the HTTP layer independent from React.
export function subscribeToAuthExpired(listener: AuthExpiredListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyAuthExpired(): void {
  listeners.forEach((listener) => listener())
}
