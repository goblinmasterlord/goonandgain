import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-bg-primary px-4 py-2 text-center">
      <p className="text-sm font-display uppercase tracking-wider">
        Offline mód - Az adatok helyben tárolódnak
      </p>
    </div>
  )
}
