import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa_install_dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < oneWeek) {
        return
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a delay (let user explore first)
      setTimeout(() => setShowPrompt(true), 30000) // 30 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-bg-secondary border-2 border-accent p-4 shadow-harsh">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 border border-accent flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💪</span>
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-text-primary uppercase tracking-wide text-sm">
            Telepítsd az appot!
          </h3>
          <p className="text-text-muted text-2xs mt-1">
            Gyorsabb hozzáférés és offline használat
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 bg-accent text-bg-primary font-display uppercase text-sm tracking-wider hover:bg-accent/90 transition-colors"
        >
          TELEPÍTÉS
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 border border-text-muted/30 text-text-muted font-display uppercase text-sm tracking-wider hover:border-accent hover:text-accent transition-colors"
        >
          KÉSŐBB
        </button>
      </div>
    </div>
  )
}
