import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, db, updateUserSplit } from '@/lib/db'
import { hasGeminiApiKey, saveGeminiApiKey } from '@/lib/ai'
import {
  isSupabaseConfigured,
  subscribeSyncState,
  processSyncQueue,
  migrateLocalDataToSupabase,
  isMigrated,
  changeRecoveryPin,
  checkProfileNameAvailable,
  registerProfile,
  isOnline,
} from '@/lib/sync'
import type { SyncState } from '@/lib/sync'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { getAvatarPath, COACH_NAMES, getAvailableCoaches } from '@/lib/utils/avatar'
import type { User, SplitType, TrainingDays, CoachAvatar } from '@/types'

// Default schedules for each split type
const BRO_SPLIT_DEFAULT: TrainingDays = {
  monday: 'chest',
  tuesday: 'back',
  wednesday: 'shoulders',
  thursday: 'arms',
  friday: 'legs',
  saturday: 'flex',
  sunday: 'rest',
}

const PPL_DEFAULT: TrainingDays = {
  monday: 'push',
  tuesday: 'pull',
  wednesday: 'legs',
  thursday: 'push',
  friday: 'pull',
  saturday: 'legs',
  sunday: 'rest',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWeightEdit, setShowWeightEdit] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [showApiKeyEdit, setShowApiKeyEdit] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [devTapCount, setDevTapCount] = useState(0)
  const [showSplitConfirm, setShowSplitConfirm] = useState(false)
  const [pendingSplitType, setPendingSplitType] = useState<SplitType | null>(null)

  // Sync state
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
    isMigrated: false,
  })
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  // PIN change state
  const [showPinChange, setShowPinChange] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [pinChangeError, setPinChangeError] = useState<string | null>(null)
  const [isPinChanging, setIsPinChanging] = useState(false)

  // Profile setup state (for users without profileName)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [setupProfileName, setSetupProfileName] = useState('')
  const [setupPin, setSetupPin] = useState('')
  const [setupConfirmPin, setSetupConfirmPin] = useState('')
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [profileSetupError, setProfileSetupError] = useState<string | null>(null)
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false)

  useEffect(() => {
    loadUser()
    setHasApiKey(hasGeminiApiKey())

    // Subscribe to sync state changes
    const unsubscribe = subscribeSyncState(setSyncState)
    return () => unsubscribe()
  }, [])

  // Debounced profile name availability check
  useEffect(() => {
    if (!setupProfileName || setupProfileName.length < 2) {
      setNameAvailable(null)
      return
    }

    // Validate format first
    const validPattern = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9\s]+$/
    if (!validPattern.test(setupProfileName)) {
      setNameAvailable(null)
      return
    }

    setIsCheckingName(true)
    const timer = setTimeout(async () => {
      try {
        const available = await checkProfileNameAvailable(setupProfileName)
        setNameAvailable(available)
      } catch {
        setNameAvailable(null)
      } finally {
        setIsCheckingName(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [setupProfileName])

  const loadUser = async () => {
    setIsLoading(true)
    try {
      const userData = await getUser()
      setUser(userData || null)
      if (userData) {
        setWeightInput(userData.currentWeightKg.toString())
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateWeight = async () => {
    if (!user || !weightInput) return

    const newWeight = parseFloat(weightInput)
    if (isNaN(newWeight) || newWeight <= 0) return

    try {
      await db.users.update(user.id, {
        currentWeightKg: newWeight,
        weightUpdatedAt: new Date(),
      })
      await db.weightHistory.add({
        userId: user.id,
        weightKg: newWeight,
        recordedAt: new Date(),
      })
      setUser({ ...user, currentWeightKg: newWeight })
      setShowWeightEdit(false)
    } catch (error) {
      console.error('Failed to update weight:', error)
    }
  }

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      saveGeminiApiKey(apiKeyInput.trim())
      setHasApiKey(true)
      setShowApiKeyEdit(false)
      setApiKeyInput('')
    }
  }

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key')
    setHasApiKey(false)
  }

  const handleSplitChange = (newSplitType: SplitType) => {
    if (newSplitType === user?.splitType) return
    setPendingSplitType(newSplitType)
    setShowSplitConfirm(true)
  }

  const confirmSplitChange = async () => {
    if (!user || !pendingSplitType) return

    try {
      const newTrainingDays = pendingSplitType === 'ppl' ? PPL_DEFAULT : BRO_SPLIT_DEFAULT
      await updateUserSplit(pendingSplitType, newTrainingDays)
      setUser({ ...user, splitType: pendingSplitType, trainingDays: newTrainingDays })
      setShowSplitConfirm(false)
      setPendingSplitType(null)
    } catch (error) {
      console.error('Failed to update split type:', error)
    }
  }

  const cancelSplitChange = () => {
    setShowSplitConfirm(false)
    setPendingSplitType(null)
  }

  const handleAvatarChange = async (newAvatar: CoachAvatar) => {
    if (!user || newAvatar === user.coachAvatar) return

    try {
      await db.users.update(user.id, { coachAvatar: newAvatar })
      setUser({ ...user, coachAvatar: newAvatar })
    } catch (error) {
      console.error('Failed to update avatar:', error)
    }
  }

  const handleSyncNow = async () => {
    await processSyncQueue()
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    setMigrationError(null)

    const result = await migrateLocalDataToSupabase()

    setIsMigrating(false)
    if (!result.success) {
      setMigrationError(result.error || 'Ismeretlen hiba')
    }
  }

  const handlePinChange = async () => {
    if (!user) return

    // Validate inputs
    if (currentPin.length !== 4 || newPin.length !== 4) {
      setPinChangeError('A PIN-nek 4 számjegyűnek kell lennie')
      return
    }

    if (newPin !== confirmNewPin) {
      setPinChangeError('Az új PIN-ek nem egyeznek')
      return
    }

    if (!isOnline()) {
      setPinChangeError('Nincs internetkapcsolat')
      return
    }

    setIsPinChanging(true)
    setPinChangeError(null)

    try {
      const success = await changeRecoveryPin(user.id, currentPin, newPin)

      if (success) {
        setShowPinChange(false)
        setCurrentPin('')
        setNewPin('')
        setConfirmNewPin('')
      } else {
        setPinChangeError('Hibás jelenlegi PIN')
      }
    } catch (err) {
      setPinChangeError(err instanceof Error ? err.message : 'Hiba történt')
    } finally {
      setIsPinChanging(false)
    }
  }

  const closePinChangeModal = () => {
    setShowPinChange(false)
    setCurrentPin('')
    setNewPin('')
    setConfirmNewPin('')
    setPinChangeError(null)
  }

  const handleProfileSetup = async () => {
    if (!user) return

    // Validate profile name
    const trimmedName = setupProfileName.trim()
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setProfileSetupError('A profilnév 2-20 karakter hosszú legyen')
      return
    }

    const validPattern = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9\s]+$/
    if (!validPattern.test(trimmedName)) {
      setProfileSetupError('Csak betűk, számok és szóközök használhatók')
      return
    }

    if (nameAvailable === false) {
      setProfileSetupError('Ez a profilnév már foglalt')
      return
    }

    // Validate PIN
    if (setupPin.length !== 4) {
      setProfileSetupError('A PIN-nek 4 számjegyűnek kell lennie')
      return
    }

    if (setupPin !== setupConfirmPin) {
      setProfileSetupError('A PIN kódok nem egyeznek')
      return
    }

    if (!isOnline()) {
      setProfileSetupError('Nincs internetkapcsolat')
      return
    }

    setIsSettingUpProfile(true)
    setProfileSetupError(null)

    try {
      // First migrate data if not done yet
      if (!isMigrated()) {
        await migrateLocalDataToSupabase()
      }

      // Register profile with PIN
      const success = await registerProfile(user.id, trimmedName, setupPin)

      if (success) {
        // Update local user record with profile name
        await db.users.update(user.id, { profileName: trimmedName })
        setUser({ ...user, profileName: trimmedName })

        // Reset form and close
        setShowProfileSetup(false)
        setSetupProfileName('')
        setSetupPin('')
        setSetupConfirmPin('')
        setNameAvailable(null)
      } else {
        setProfileSetupError('Nem sikerült a profil létrehozása. Próbáld újra.')
      }
    } catch (err) {
      setProfileSetupError(err instanceof Error ? err.message : 'Hiba történt')
    } finally {
      setIsSettingUpProfile(false)
    }
  }

  const closeProfileSetupModal = () => {
    setShowProfileSetup(false)
    setSetupProfileName('')
    setSetupPin('')
    setSetupConfirmPin('')
    setNameAvailable(null)
    setProfileSetupError(null)
  }

  const getSyncStatusText = () => {
    if (!isSupabaseConfigured()) return 'Nincs beállítva'
    if (syncState.status === 'offline') return 'Offline'
    if (syncState.status === 'syncing') return 'Szinkronizálás...'
    if (syncState.status === 'error') return 'Hiba'
    if (syncState.pendingCount > 0) return `${syncState.pendingCount} függőben`
    return 'Szinkronizálva'
  }

  const getSyncStatusColor = () => {
    if (!isSupabaseConfigured()) return 'text-text-muted'
    if (syncState.status === 'offline') return 'text-yellow-500'
    if (syncState.status === 'syncing') return 'text-accent'
    if (syncState.status === 'error') return 'text-red-500'
    if (syncState.pendingCount > 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const trainingDaysCount = user?.trainingDays
    ? Object.values(user.trainingDays).filter((t) => t && t !== 'rest').length
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20">
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">Profil</h1>
        <p className="text-text-muted text-xs mt-0.5">Beállítások és adatok</p>
      </header>

      {/* Profile Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Személyes adatok
        </h2>

        {/* Weight */}
        <div className="p-4 bg-bg-secondary border border-text-muted/20 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
                Testsúly
              </p>
              <p className="font-mono text-2xl font-bold text-accent">
                {user?.currentWeightKg || '—'}
                <span className="text-text-muted text-sm ml-1">kg</span>
              </p>
            </div>
            <button
              onClick={() => setShowWeightEdit(!showWeightEdit)}
              className="px-3 py-1.5 border border-text-muted/30 text-text-muted text-2xs font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
            >
              {showWeightEdit ? 'MÉGSE' : 'MÓDOSÍT'}
            </button>
          </div>

          {showWeightEdit && (
            <div className="mt-4 pt-4 border-t border-text-muted/20">
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="flex-1 p-3 bg-bg-elevated border border-text-muted/30 font-mono text-lg text-text-primary focus:border-accent focus:outline-none"
                  placeholder="Testsúly"
                />
                <Button onClick={handleUpdateWeight}>MENTÉS</Button>
              </div>
            </div>
          )}
        </div>

        {/* Gender */}
        <div className="p-4 bg-bg-secondary border border-text-muted/20 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-display uppercase tracking-wider text-text-muted">Nem</p>
              <p className="font-display text-lg text-text-primary">
                {user?.gender === 'male' ? 'Férfi' : 'Nő'}
              </p>
            </div>
          </div>
        </div>

        {/* Training Days */}
        <div className="p-4 bg-bg-secondary border border-text-muted/20 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
                Edzésnapok
              </p>
              <p className="font-display text-lg text-text-primary">
                {trainingDaysCount} nap/hét
              </p>
            </div>
          </div>
        </div>

        {/* Profile Setup - for users without profile name */}
        {!user?.profileName && isSupabaseConfigured() && (
          <div className="p-4 bg-bg-secondary border border-accent/30 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-2xs font-display uppercase tracking-wider text-accent">
                  Felhő profil
                </p>
                <p className="text-text-secondary text-sm mt-1">
                  Állíts be profilnevet és PIN kódot az adataid felhőbe mentéséhez és visszaállításához.
                </p>
              </div>
              <button
                onClick={() => setShowProfileSetup(true)}
                className="ml-3 px-3 py-1.5 bg-accent text-bg-primary text-2xs font-display uppercase tracking-wider font-bold hover:bg-accent/90 transition-colors"
              >
                BEÁLLÍT
              </button>
            </div>
          </div>
        )}

        {/* Profile Name */}
        {user?.profileName && (
          <div className="p-4 bg-bg-secondary border border-text-muted/20 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
                  Profilnév
                </p>
                <p className="font-display text-lg text-accent font-bold">
                  {user.profileName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recovery PIN Management */}
        {user?.profileName && isSupabaseConfigured() && (
          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
                  Visszaállítási PIN
                </p>
                <p className="font-display text-lg text-text-primary">
                  ••••
                </p>
              </div>
              <button
                onClick={() => setShowPinChange(true)}
                className="px-3 py-1.5 border border-text-muted/30 text-text-muted text-2xs font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
              >
                MÓDOSÍT
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Training Program Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Edzésprogram
        </h2>

        <div className="p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-3">
            Válassz edzésfelosztást
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSplitChange('bro-split')}
              className={cn(
                'p-4 border-2 transition-all text-left',
                user?.splitType === 'bro-split'
                  ? 'border-accent bg-accent/10'
                  : 'border-text-muted/30 hover:border-text-muted/50'
              )}
            >
              <p className={cn(
                'font-display text-sm font-bold uppercase tracking-wide',
                user?.splitType === 'bro-split' ? 'text-accent' : 'text-text-primary'
              )}>
                Bro Split
              </p>
              <p className="text-2xs text-text-muted mt-1">
                5-6 nap, 1× izomcsoport/hét
              </p>
            </button>

            <button
              onClick={() => handleSplitChange('ppl')}
              className={cn(
                'p-4 border-2 transition-all text-left',
                user?.splitType === 'ppl'
                  ? 'border-accent bg-accent/10'
                  : 'border-text-muted/30 hover:border-text-muted/50'
              )}
            >
              <p className={cn(
                'font-display text-sm font-bold uppercase tracking-wide',
                user?.splitType === 'ppl' ? 'text-accent' : 'text-text-primary'
              )}>
                PPL
              </p>
              <p className="text-2xs text-text-muted mt-1">
                6 nap, 2× izomcsoport/hét
              </p>
            </button>
          </div>

          {user?.splitType && (
            <p className="text-2xs text-text-muted mt-3 text-center">
              Aktív: <span className="text-accent font-bold">
                {user.splitType === 'ppl' ? 'Push/Pull/Legs' : 'Bro Split'}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* Coach Avatar Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Edzés avatar
        </h2>

        <div className="p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-3">
            Válassz edzőt az összefoglaló képernyőkhöz
          </p>

          <div className="grid grid-cols-2 gap-3">
            {getAvailableCoaches().map((coach) => (
              <button
                key={coach}
                onClick={() => handleAvatarChange(coach)}
                className={cn(
                  'p-4 border-2 transition-all flex flex-col items-center',
                  (user?.coachAvatar ?? 'bebi') === coach
                    ? 'border-accent bg-accent/10'
                    : 'border-text-muted/30 hover:border-text-muted/50'
                )}
              >
                <img
                  src={getAvatarPath(coach, 'default')}
                  alt={COACH_NAMES[coach]}
                  className="w-20 h-20 object-contain mb-2"
                />
                <p className={cn(
                  'font-display text-sm font-bold uppercase tracking-wide',
                  (user?.coachAvatar ?? 'bebi') === coach ? 'text-accent' : 'text-text-primary'
                )}>
                  {COACH_NAMES[coach]}
                </p>
              </button>
            ))}
          </div>

          <p className="text-2xs text-text-muted mt-3 text-center">
            Aktív: <span className="text-accent font-bold">
              {COACH_NAMES[user?.coachAvatar ?? 'bebi']}
            </span>
          </p>
        </div>
      </section>

      {/* Custom Workouts Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Saját edzések
        </h2>

        <button
          onClick={() => navigate('/settings/custom-workouts')}
          className="w-full p-4 bg-bg-secondary border border-text-muted/20 flex items-center justify-between hover:border-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="square" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-display text-text-primary font-semibold">
                Egyéni edzéstervek
              </p>
              <p className="text-2xs text-text-muted">
                Hozz létre saját gyakorlatokkal
              </p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="square" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      {/* Split Change Confirmation Modal */}
      {showSplitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-bg-secondary border-2 border-text-muted/30 p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-2">
              Program váltás
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Biztosan váltani szeretnél{' '}
              <span className="text-accent font-bold">
                {pendingSplitType === 'ppl' ? 'Push/Pull/Legs' : 'Bro Split'}
              </span>{' '}
              programra? A heti beosztásod az alapértelmezettre áll vissza.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={cancelSplitChange}>
                MÉGSE
              </Button>
              <Button onClick={confirmSplitChange}>
                VÁLTÁS
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {showPinChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-bg-secondary border-2 border-text-muted/30 p-6">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-2">
              PIN megváltoztatása
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Add meg a jelenlegi és az új PIN kódodat
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-2xs font-display uppercase tracking-wider text-text-muted block mb-2">
                  Jelenlegi PIN
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setCurrentPin(filtered)
                    setPinChangeError(null)
                  }}
                  className="w-full p-3 bg-bg-elevated border border-text-muted/30 font-mono text-lg text-text-primary text-center tracking-[0.5em] focus:border-accent focus:outline-none"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="text-2xs font-display uppercase tracking-wider text-text-muted block mb-2">
                  Új PIN
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setNewPin(filtered)
                    setPinChangeError(null)
                  }}
                  className="w-full p-3 bg-bg-elevated border border-text-muted/30 font-mono text-lg text-text-primary text-center tracking-[0.5em] focus:border-accent focus:outline-none"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="text-2xs font-display uppercase tracking-wider text-text-muted block mb-2">
                  Új PIN megerősítése
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmNewPin}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setConfirmNewPin(filtered)
                    setPinChangeError(null)
                  }}
                  className="w-full p-3 bg-bg-elevated border border-text-muted/30 font-mono text-lg text-text-primary text-center tracking-[0.5em] focus:border-accent focus:outline-none"
                  placeholder="••••"
                />
              </div>
            </div>

            {pinChangeError && (
              <p className="text-sm text-danger mb-4">{pinChangeError}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={closePinChangeModal} disabled={isPinChanging}>
                MÉGSE
              </Button>
              <Button
                onClick={handlePinChange}
                disabled={isPinChanging || currentPin.length !== 4 || newPin.length !== 4 || confirmNewPin.length !== 4}
              >
                {isPinChanging ? 'MENTÉS...' : 'MENTÉS'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-bg-secondary border-2 border-text-muted/30 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-2">
              Felhő profil beállítása
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              A profilnév és PIN kód segítségével visszaállíthatod az adataidat egy új eszközön.
            </p>

            <div className="space-y-4 mb-4">
              {/* Profile Name Input */}
              <div>
                <label className="text-2xs font-display uppercase tracking-wider text-text-muted block mb-2">
                  Profilnév
                </label>
                <input
                  type="text"
                  value={setupProfileName}
                  onChange={(e) => {
                    setSetupProfileName(e.target.value)
                    setProfileSetupError(null)
                  }}
                  maxLength={20}
                  className="w-full p-3 bg-bg-elevated border border-text-muted/30 font-display text-lg text-text-primary focus:border-accent focus:outline-none"
                  placeholder="pl. Marci123"
                />
                <div className="mt-1 h-4">
                  {isCheckingName && (
                    <span className="text-2xs text-text-muted">Ellenőrzés...</span>
                  )}
                  {!isCheckingName && nameAvailable === true && setupProfileName.length >= 2 && (
                    <span className="text-2xs text-green-500">✓ Ez a név elérhető</span>
                  )}
                  {!isCheckingName && nameAvailable === false && (
                    <span className="text-2xs text-red-500">Ez a név már foglalt</span>
                  )}
                </div>
              </div>

              {/* PIN Input */}
              <div>
                <label className="text-2xs font-display uppercase tracking-wider text-text-muted block mb-2">
                  4 számjegyű PIN
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={setupPin}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setSetupPin(filtered)
                    setProfileSetupError(null)
                  }}
                  className="w-full p-3 bg-bg-elevated border border-text-muted/30 font-mono text-lg text-text-primary text-center tracking-[0.5em] focus:border-accent focus:outline-none"
                  placeholder="••••"
                />
              </div>

              {/* Confirm PIN Input */}
              <div>
                <label className="text-2xs font-display uppercase tracking-wider text-text-muted block mb-2">
                  PIN megerősítése
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={setupConfirmPin}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setSetupConfirmPin(filtered)
                    setProfileSetupError(null)
                  }}
                  className="w-full p-3 bg-bg-elevated border border-text-muted/30 font-mono text-lg text-text-primary text-center tracking-[0.5em] focus:border-accent focus:outline-none"
                  placeholder="••••"
                />
                {setupPin.length === 4 && setupConfirmPin.length === 4 && (
                  <div className="mt-1">
                    {setupPin === setupConfirmPin ? (
                      <span className="text-2xs text-green-500">✓ PIN megerősítve</span>
                    ) : (
                      <span className="text-2xs text-red-500">A PIN kódok nem egyeznek</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 bg-accent/10 border border-accent/30 mb-4">
              <p className="text-2xs text-accent">
                ⚠️ Jegyezd meg a profilnevet és PIN kódot! Ezek nélkül nem tudod visszaállítani az adataidat.
              </p>
            </div>

            {profileSetupError && (
              <p className="text-sm text-danger mb-4">{profileSetupError}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={closeProfileSetupModal} disabled={isSettingUpProfile}>
                MÉGSE
              </Button>
              <Button
                onClick={handleProfileSetup}
                disabled={
                  isSettingUpProfile ||
                  setupProfileName.length < 2 ||
                  setupPin.length !== 4 ||
                  setupConfirmPin.length !== 4 ||
                  setupPin !== setupConfirmPin ||
                  nameAvailable === false
                }
              >
                {isSettingUpProfile ? 'MENTÉS...' : 'MENTÉS'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Sync Section */}
      {isSupabaseConfigured() && (
        <section className="px-5 py-4 border-b border-text-muted/10">
          <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
            Felhő szinkron
          </h2>

          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            {/* Sync Status */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
                  Állapot
                </p>
                <p className={`font-display text-lg ${getSyncStatusColor()}`}>
                  {getSyncStatusText()}
                </p>
              </div>
              <button
                onClick={handleSyncNow}
                disabled={syncState.status === 'syncing' || syncState.status === 'offline'}
                className="px-3 py-1.5 border border-text-muted/30 text-text-muted text-2xs font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncState.status === 'syncing' ? 'SZINKRON...' : 'SZINKRON'}
              </button>
            </div>

            {/* Last Sync Time */}
            {syncState.lastSyncAt && (
              <p className="text-2xs text-text-muted mb-3">
                Utolsó szinkron:{' '}
                {new Date(syncState.lastSyncAt).toLocaleString('hu-HU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}

            {/* Migration */}
            {!syncState.isMigrated && !isMigrated() && (
              <div className="pt-3 border-t border-text-muted/20">
                <p className="text-2xs text-text-muted mb-3">
                  Meglévő adataid még nincsenek feltöltve a felhőbe.
                </p>
                <Button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="w-full"
                >
                  {isMigrating ? 'FELTÖLTÉS...' : 'ADATOK FELTÖLTÉSE'}
                </Button>
                {migrationError && (
                  <p className="text-2xs text-red-500 mt-2">{migrationError}</p>
                )}
              </div>
            )}

            {/* Sync Error */}
            {syncState.lastError && (
              <p className="text-2xs text-red-500 mt-2">
                Hiba: {syncState.lastError}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Coach Bebi Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Coach Bebi
        </h2>

        <div className="p-4 bg-bg-secondary border border-text-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
                Gemini API kulcs
              </p>
              <p className="font-display text-lg text-text-primary">
                {hasApiKey ? '••••••••••••' : 'Nincs beállítva'}
              </p>
            </div>
            <button
              onClick={() => {
                if (hasApiKey) {
                  handleClearApiKey()
                } else {
                  setShowApiKeyEdit(!showApiKeyEdit)
                }
              }}
              className="px-3 py-1.5 border border-text-muted/30 text-text-muted text-2xs font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
            >
              {hasApiKey ? 'TÖRLÉS' : showApiKeyEdit ? 'MÉGSE' : 'BEÁLLÍT'}
            </button>
          </div>

          {showApiKeyEdit && (
            <div className="pt-3 border-t border-text-muted/20">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 p-3 bg-bg-elevated border border-text-muted/30 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                  placeholder="API kulcs"
                />
                <Button onClick={handleSaveApiKey}>MENTÉS</Button>
              </div>
              <p className="text-2xs text-text-muted mt-2">
                Kulcsot a{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google AI Studio
                </a>
                -ban szerezhetsz.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* App Info */}
      <section className="px-5 py-4">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Alkalmazás
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => {
              const newCount = devTapCount + 1
              setDevTapCount(newCount)
              if (newCount >= 5) {
                navigate('/dev')
                setDevTapCount(0)
              }
            }}
            className="w-full p-4 bg-bg-secondary border border-text-muted/20 flex items-center justify-between text-left"
          >
            <span className="font-display text-text-primary">Verzió</span>
            <span className="font-mono text-text-muted">
              1.3.0{devTapCount > 0 && devTapCount < 5 && ` (${5 - devTapCount})`}
            </span>
          </button>

          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            <p className="font-display text-text-primary mb-2">GoonAndGain</p>
            <p className="text-2xs text-text-muted">
              Tudományosan megalapozott edzéstervező app középhaladó liftereknek.
              Helyben tárolt adatok, progresszív túlterhelés, és AI coaching.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
