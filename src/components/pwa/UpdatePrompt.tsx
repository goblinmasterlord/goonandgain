import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error:', error)
    },
  })

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-bg-secondary border-2 border-success p-4 shadow-harsh">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 border border-success flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-text-primary uppercase tracking-wide text-sm">
            Frissítés elérhető!
          </h3>
          <p className="text-text-muted text-2xs mt-1">
            Új verzió töltődött le
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleUpdate}
          className="flex-1 py-2 bg-success text-bg-primary font-display uppercase text-sm tracking-wider hover:bg-success/90 transition-colors"
        >
          FRISSÍTÉS
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 border border-text-muted/30 text-text-muted font-display uppercase text-sm tracking-wider hover:border-success hover:text-success transition-colors"
        >
          KÉSŐBB
        </button>
      </div>
    </div>
  )
}
