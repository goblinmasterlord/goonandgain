import { useState, useEffect } from 'react'
import { getUser, db } from '@/lib/db'
import { Button } from '@/components/ui'
import type { User } from '@/types'

const WEIGHT_CHECKIN_DAYS = 7 // Remind after 7 days
const DISMISS_KEY = 'weight_checkin_dismissed'

export function WeightCheckInPrompt() {
  const [user, setUser] = useState<User | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkWeightStatus()
  }, [])

  const checkWeightStatus = async () => {
    try {
      const userData = await getUser()
      if (!userData) return

      setUser(userData)
      setWeightInput(userData.currentWeightKg.toString())

      // Check if dismissed recently
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt)
        const hoursSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60)
        if (hoursSinceDismiss < 24) return // Don't show for 24 hours after dismiss
      }

      // Check if weight update is needed
      const lastUpdate = userData.weightUpdatedAt
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceUpdate >= WEIGHT_CHECKIN_DAYS) {
        setShowPrompt(true)
      }
    } catch (error) {
      console.error('Failed to check weight status:', error)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    setShowPrompt(false)
  }

  const handleSameWeight = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await db.users.update(user.id, {
        weightUpdatedAt: new Date(),
      })
      setShowPrompt(false)
    } catch (error) {
      console.error('Failed to update weight:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateWeight = async () => {
    if (!user || !weightInput) return

    const newWeight = parseFloat(weightInput)
    if (isNaN(newWeight) || newWeight <= 0) return

    setIsSaving(true)
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
      setShowPrompt(false)
    } catch (error) {
      console.error('Failed to update weight:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 pb-4">
      <div className="bg-bg-secondary border-2 border-accent p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <div>
              <p className="font-display font-bold text-text-primary uppercase tracking-wide text-sm">
                Testsúly check-in
              </p>
              <p className="text-2xs text-text-muted">
                Több mint egy hete nem frissítetted
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-primary p-1"
            aria-label="Elrejtés"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showInput ? (
          <div className="flex gap-2">
            <button
              onClick={handleSameWeight}
              disabled={isSaving}
              className="flex-1 py-2.5 border border-text-muted/30 text-text-primary font-display text-2xs uppercase tracking-wider hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
            >
              UGYANANNYI ({user?.currentWeightKg} KG)
            </button>
            <button
              onClick={() => setShowInput(true)}
              className="flex-1 py-2.5 bg-accent text-bg-primary font-display text-2xs uppercase tracking-wider hover:bg-accent/90 transition-colors"
            >
              VÁLTOZOTT
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="flex-1 p-2.5 bg-bg-elevated border border-text-muted/30 font-mono text-text-primary focus:border-accent focus:outline-none"
              placeholder="Testsúly"
              autoFocus
            />
            <Button onClick={handleUpdateWeight} disabled={isSaving}>
              MENTÉS
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
