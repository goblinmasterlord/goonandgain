import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { db } from '@/lib/db'

// Fallback UUID generator for browsers that don't support crypto.randomUUID
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers with secure context)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback using crypto.getRandomValues (wider browser support)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    // Set version 4 and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // Last resort fallback (not cryptographically secure, but functional)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function ReadyPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = JSON.parse(localStorage.getItem('onboarding_data') || '{}')

      // Create user in database
      const userId = generateUUID()
      await db.users.add({
        id: userId,
        createdAt: new Date(),
        currentWeightKg: data.weight || 80,
        gender: data.gender || 'male',
        birthYear: data.age ? new Date().getFullYear() - data.age : undefined,
        splitType: data.splitType || 'bro-split',
        trainingDays: data.trainingDays || {},
        weightUpdatedAt: new Date(),
      })

      // Add initial weight history
      await db.weightHistory.add({
        userId,
        weightKg: data.weight || 80,
        recordedAt: new Date(),
      })

      // Clear temporary storage
      localStorage.removeItem('onboarding_data')
      localStorage.setItem('onboarding_complete', 'true')

      // Notify App component that onboarding is complete
      window.dispatchEvent(new CustomEvent('onboarding-complete'))

      // Small delay to ensure state updates propagate
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Navigate to home
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Failed to save user data:', err)

      // Check if it's an IndexedDB error (common on mobile Safari private mode)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const errorName = err instanceof Error ? err.name : 'Unknown'

      // Log detailed error for debugging
      console.error('Error details:', { name: errorName, message: errorMessage, err })

      if (errorMessage.includes('QuotaExceededError') ||
          errorMessage.includes('IndexedDB') ||
          errorMessage.includes('storage') ||
          errorName === 'QuotaExceededError') {
        setError('Privát böngészés módban az alkalmazás nem tud adatokat menteni. Kérlek, használj normál böngészőt.')
      } else {
        // Show more details in development
        setError(`Hiba történt a mentés során: ${errorName} - ${errorMessage.substring(0, 100)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-8 animate-fade-in">
        <div className="text-6xl">💪</div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold">Kész!</h1>
          <p className="text-text-secondary max-w-sm">
            Az első edzéseden rögzítjük a súlyokat, és onnan építkezünk. Minden egyes edzéssel egyre pontosabb lesz a rendszer.
          </p>
        </div>

        <div className="pt-8 space-y-3 w-full max-w-xs mx-auto">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger text-danger text-sm mb-4">
              {error}
            </div>
          )}
          <Button
            size="lg"
            className="w-full glow-accent"
            onClick={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? 'Mentés...' : 'Irány az edzés!'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding/training')}
            disabled={isLoading}
          >
            Vissza
          </Button>
        </div>
      </div>
    </div>
  )
}
