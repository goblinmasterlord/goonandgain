import { useState, useEffect } from 'react'
import { getUser, db } from '@/lib/db'
import { hasGeminiApiKey, saveGeminiApiKey } from '@/lib/ai'
import { Button } from '@/components/ui'
import type { User } from '@/types'

export function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWeightEdit, setShowWeightEdit] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [showApiKeyEdit, setShowApiKeyEdit] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)

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
      <header className="px-5 pt-6 pb-4 border-b-2 border-text-muted/20">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide">Profil</h1>
        <p className="text-text-muted text-sm mt-1">Beállítások és adatok</p>
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
          <div className="p-4 bg-bg-secondary border border-text-muted/20 flex items-center justify-between">
            <span className="font-display text-text-primary">Verzió</span>
            <span className="font-mono text-text-muted">1.0.0</span>
          </div>

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
