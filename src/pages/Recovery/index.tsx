import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import {
  isSupabaseConfigured,
  isOnline,
  verifyRecovery,
  restoreFromCloud,
} from '@/lib/sync'
import type { RecoveryResult } from '@/lib/sync'

type RecoveryStep = 'credentials' | 'confirm' | 'restoring'

export function RecoveryPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<RecoveryStep>('credentials')
  const [profileName, setProfileName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recoveredProfile, setRecoveredProfile] = useState<RecoveryResult | null>(null)
  const [isOffline, setIsOffline] = useState(!isOnline())

  // Check online status
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

  const handlePinChange = (value: string) => {
    const filtered = value.replace(/\D/g, '').slice(0, 4)
    setPin(filtered)
  }

  const handleVerify = async () => {
    if (!profileName.trim() || pin.length !== 4) {
      setError('Add meg a profilneved és a 4 számjegyű PIN-t')
      return
    }

    if (!isSupabaseConfigured()) {
      setError('Felhő szinkron nincs beállítva')
      return
    }

    if (isOffline) {
      setError('Nincs internetkapcsolat')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await verifyRecovery(profileName.trim(), pin)

      if (!result) {
        setError('Nem található ilyen profil, vagy hibás a PIN')
        setIsLoading(false)
        return
      }

      setRecoveredProfile(result)
      setStep('confirm')
    } catch (err) {
      console.error('[Recovery] Verification failed:', err)
      setError(err instanceof Error ? err.message : 'Hiba történt az ellenőrzés során')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!recoveredProfile) return

    setStep('restoring')
    setError(null)

    try {
      await restoreFromCloud(recoveredProfile)

      // Notify App component that user exists now
      window.dispatchEvent(new CustomEvent('onboarding-complete'))

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Navigate to home
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[Recovery] Restore failed:', err)
      setError(err instanceof Error ? err.message : 'Hiba történt a visszaállítás során')
      setStep('confirm')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nincs adat'
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-6">
          <div className="text-5xl">🔒</div>
          <h1 className="font-display text-2xl font-bold">Felhő szinkron nincs beállítva</h1>
          <p className="text-text-secondary max-w-sm">
            A profil visszaállításhoz szükséges a felhő szinkron. Kérd meg a fejlesztőt, hogy állítsa be.
          </p>
          <Button variant="ghost" onClick={() => navigate('/onboarding')}>
            VISSZA
          </Button>
        </div>
      </div>
    )
  }

  // Restoring state
  if (step === 'restoring') {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-6 animate-pulse">
          <div className="text-5xl">⏳</div>
          <h1 className="font-display text-2xl font-bold">Visszaállítás...</h1>
          <p className="text-text-secondary">
            Kérlek várj, amíg visszaállítjuk az adataidat
          </p>
        </div>
      </div>
    )
  }

  // Confirm step
  if (step === 'confirm' && recoveredProfile) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="px-6 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
              Profil megtalálva
            </h1>
            <p className="text-text-secondary text-sm">
              Ez a te profilod?
            </p>
          </header>

          {/* Profile info */}
          <div className="bg-bg-secondary border border-text-muted/20 p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm uppercase tracking-wider">Profilnév</span>
                <span className="font-display font-bold text-accent">
                  {recoveredProfile.profile_name}
                </span>
              </div>
              <div className="h-px bg-text-muted/20" />
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm uppercase tracking-wider">Létrehozva</span>
                <span className="font-mono text-sm">
                  {formatDate(recoveredProfile.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm uppercase tracking-wider">Utolsó edzés</span>
                <span className="font-mono text-sm">
                  {formatDate(recoveredProfile.last_active_at)}
                </span>
              </div>
              <div className="h-px bg-text-muted/20" />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-bg-primary">
                  <div className="font-mono text-3xl font-bold text-accent">
                    {recoveredProfile.session_count}
                  </div>
                  <div className="text-2xs text-text-muted uppercase tracking-wider mt-1">
                    Edzés
                  </div>
                </div>
                <div className="text-center p-4 bg-bg-primary">
                  <div className="font-mono text-3xl font-bold text-accent">
                    {recoveredProfile.total_sets}
                  </div>
                  <div className="text-2xs text-text-muted uppercase tracking-wider mt-1">
                    Sorozat
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-danger/10 border border-danger text-danger text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full glow-accent"
              onClick={handleRestore}
            >
              VISSZAÁLLÍTÁS
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('credentials')
                setRecoveredProfile(null)
                setError(null)
              }}
            >
              NEM EZ AZ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Credentials step (default)
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="px-6 py-8">
        {/* Header */}
        <header className="mb-10">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
            Profil visszaállítása
          </h1>
          <p className="text-text-secondary text-sm">
            Add meg a profilneved és a PIN kódod
          </p>
        </header>

        {/* Offline warning */}
        {isOffline && (
          <div className="mb-6 p-3 bg-warning/10 border border-warning text-warning text-sm">
            Nincs internetkapcsolat. Csatlakozz a hálózathoz a visszaállításhoz.
          </div>
        )}

        {/* Form */}
        <div className="space-y-8">
          <div>
            <Input
              label="Profilnév"
              type="text"
              placeholder="pl. Sanyi"
              value={profileName}
              onChange={(e) => {
                setProfileName(e.target.value)
                setError(null)
              }}
              autoComplete="off"
            />
          </div>

          <div>
            <Input
              label="4 számjegyű PIN"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="• • • •"
              value={pin}
              onChange={(e) => {
                handlePinChange(e.target.value)
                setError(null)
              }}
              variant="mono"
              autoComplete="off"
              maxLength={4}
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-danger/10 border border-danger text-danger text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-10 space-y-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!profileName.trim() || pin.length !== 4 || isLoading || isOffline}
            onClick={handleVerify}
          >
            {isLoading ? 'KERESÉS...' : 'KERESÉS'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding')}
          >
            MÉGSEM
          </Button>
        </div>

        {/* Help text */}
        <div className="mt-8 p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">
            SEGÍTSÉG
          </p>
          <p className="text-sm text-text-secondary">
            Ha nem emlékszel a PIN kódodra, sajnos nem tudjuk visszaállítani a profilod.
            A biztonság érdekében nincs PIN visszaállítási lehetőség.
          </p>
        </div>
      </div>
    </div>
  )
}
