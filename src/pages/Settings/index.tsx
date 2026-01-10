import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, db, updateUserSplit } from '@/lib/db'
import { hasGeminiApiKey, saveGeminiApiKey } from '@/lib/ai'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { User, SplitType, TrainingDays } from '@/types'

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

  useEffect(() => {
    loadUser()
    setHasApiKey(hasGeminiApiKey())
  }, [])

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
        <div className="p-4 bg-bg-secondary border border-text-muted/20">
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
              1.0.0{devTapCount > 0 && devTapCount < 5 && ` (${5 - devTapCount})`}
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
