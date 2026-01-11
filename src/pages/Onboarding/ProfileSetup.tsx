import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { checkProfileNameAvailable, isSupabaseConfigured, isOnline } from '@/lib/sync'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const [profileName, setProfileName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
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

  // Validate profile name
  const validateProfileName = (name: string): boolean => {
    // Allow letters (including Hungarian), numbers, spaces
    const validPattern = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9\s]+$/
    return name.length >= 2 && name.length <= 20 && validPattern.test(name)
  }

  // Check name availability when user stops typing
  useEffect(() => {
    const trimmedName = profileName.trim()
    if (!trimmedName || !validateProfileName(trimmedName)) {
      return
    }

    const timer = setTimeout(async () => {
      if (!isSupabaseConfigured() || isOffline) return

      setIsCheckingName(true)
      setNameError(null)

      try {
        const available = await checkProfileNameAvailable(trimmedName)
        if (!available) {
          setNameError('Ez a név már foglalt')
        }
      } catch {
        // Silently fail - will be checked again on submit
      } finally {
        setIsCheckingName(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [profileName, isOffline])

  // Validate PIN
  const validatePin = (pinValue: string): boolean => {
    return /^\d{4}$/.test(pinValue)
  }

  // Check form validity
  const profileNameTrimmed = profileName.trim()
  const isNameValid = validateProfileName(profileNameTrimmed) && !nameError
  const isPinValid = validatePin(pin)
  const isPinMatch = pin === confirmPin
  const isValid = isNameValid && isPinValid && isPinMatch && !isCheckingName

  const handlePinChange = (value: string) => {
    // Only allow digits, max 4
    const filtered = value.replace(/\D/g, '').slice(0, 4)
    setPin(filtered)
    setPinError(null)
  }

  const handleConfirmPinChange = (value: string) => {
    const filtered = value.replace(/\D/g, '').slice(0, 4)
    setConfirmPin(filtered)
    setPinError(null)
  }

  const handleNext = async () => {
    // Final validation
    if (!isPinMatch) {
      setPinError('A PIN kódok nem egyeznek')
      return
    }

    // If online and Supabase configured, do final name check
    if (isSupabaseConfigured() && !isOffline) {
      setIsCheckingName(true)
      try {
        const available = await checkProfileNameAvailable(profileNameTrimmed)
        if (!available) {
          setNameError('Ez a név már foglalt')
          setIsCheckingName(false)
          return
        }
      } catch {
        // Continue anyway - will fail during sync if name taken
      }
      setIsCheckingName(false)
    }

    // Save to onboarding data
    const existingData = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    localStorage.setItem(
      'onboarding_data',
      JSON.stringify({
        ...existingData,
        profileName: profileNameTrimmed,
        recoveryPin: pin,
      })
    )

    navigate('/onboarding/program')
  }

  const showOfflineWarning = isOffline && isSupabaseConfigured()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Progress bar - now 02/05 */}
      <div className="h-1 bg-bg-elevated">
        <div className="h-full w-[40%] bg-accent" />
      </div>

      <div className="px-6 py-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm text-accent">02</span>
            <div className="flex-1 h-px bg-text-muted/20" />
            <span className="font-mono text-sm text-text-muted">05</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
            Profil beállítása
          </h1>
          <p className="text-text-secondary text-sm">
            Ezzel visszaállíthatod az adataidat, ha elvesznek
          </p>
        </header>

        {/* Offline warning */}
        {showOfflineWarning && (
          <div className="mb-6 p-3 bg-warning/10 border border-warning text-warning text-sm">
            Offline módban vagy. A név foglaltság csak online ellenőrizhető.
          </div>
        )}

        {/* Form */}
        <div className="space-y-8">
          {/* Profile Name */}
          <div>
            <Input
              label="Profilnév"
              type="text"
              placeholder="pl. Sanyi"
              value={profileName}
              onChange={(e) => {
                setProfileName(e.target.value)
                setNameError(null)
              }}
              autoComplete="off"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xs text-text-muted uppercase tracking-wider">
                2-20 karakter, egyedi név
              </p>
              {isCheckingName && (
                <span className="text-2xs text-text-muted">Ellenőrzés...</span>
              )}
            </div>
            {nameError && (
              <p className="mt-2 text-sm text-danger">{nameError}</p>
            )}
          </div>

          {/* PIN */}
          <div>
            <Input
              label="4 számjegyű PIN"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="• • • •"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              variant="mono"
              autoComplete="off"
              maxLength={4}
            />
            <p className="text-2xs text-text-muted mt-2 uppercase tracking-wider">
              Visszaállításhoz szükséges
            </p>
          </div>

          {/* Confirm PIN */}
          <div>
            <Input
              label="PIN megerősítése"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="• • • •"
              value={confirmPin}
              onChange={(e) => handleConfirmPinChange(e.target.value)}
              variant="mono"
              autoComplete="off"
              maxLength={4}
            />
            {pinError && (
              <p className="mt-2 text-sm text-danger">{pinError}</p>
            )}
            {confirmPin && pin !== confirmPin && (
              <p className="mt-2 text-sm text-warning">A PIN kódok nem egyeznek</p>
            )}
            {confirmPin && pin === confirmPin && pin.length === 4 && (
              <p className="mt-2 text-sm text-success">PIN megerősítve</p>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="mt-8 p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">
            FONTOS
          </p>
          <p className="text-sm text-text-secondary">
            Ha törlöd a böngésző adatait, ezzel a névvel és PIN-nel tudod
            visszaállítani a profilod. <strong className="text-text-primary">Jegyezd meg őket!</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 space-y-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!isValid}
            onClick={handleNext}
          >
            {isCheckingName ? 'ELLENŐRZÉS...' : 'TOVÁBB'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding/personal')}
          >
            VISSZA
          </Button>
        </div>
      </div>
    </div>
  )
}
