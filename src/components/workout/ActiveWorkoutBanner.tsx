import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutStore } from '@/stores'
import {
  getActiveSession,
  getSetLogsForSession,
  isCustomTemplateId,
  getCustomTemplateNumericId,
  getCustomTemplateById,
  customTemplateToWorkoutTemplate,
  db,
} from '@/lib/db'
import { getTemplateById, getTemplateTotalSets } from '@/data'
import type { WorkoutTemplate } from '@/types'

// Muscle colors for the accent stripe
const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ff4d00',
  back: '#0066ff',
  shoulders: '#9333ea',
  arms: '#ff0066',
  legs: '#00d4aa',
  push: '#f97316',
  pull: '#22d3ee',
  flex: '#8a8a8a',
}

interface ActiveWorkoutInfo {
  sessionId: number
  templateId: string
  template: WorkoutTemplate
  completedSets: number
  totalSets: number
  startedAt: Date
  elapsedMinutes: number
}

export function ActiveWorkoutBanner() {
  const navigate = useNavigate()
  const { isActive, sessionId, template, startedAt, completedSets } = useWorkoutStore()
  const [dbWorkout, setDbWorkout] = useState<ActiveWorkoutInfo | null>(null)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Check for active workout in store or database
  useEffect(() => {
    async function checkActiveWorkout() {
      setIsLoading(true)

      // If store has active workout, we don't need DB check
      if (isActive && sessionId && template) {
        setDbWorkout(null)
        setIsLoading(false)
        return
      }

      // Check database for incomplete sessions
      try {
        const activeSession = await getActiveSession()
        if (activeSession && activeSession.id) {
          // Load template
          let workoutTemplate: WorkoutTemplate | null = null
          const templateId = activeSession.templateId

          if (isCustomTemplateId(templateId)) {
            const numericId = getCustomTemplateNumericId(templateId)
            if (numericId) {
              const customTemplate = await getCustomTemplateById(numericId)
              if (customTemplate) {
                workoutTemplate = customTemplateToWorkoutTemplate(customTemplate)
              }
            }
          } else {
            workoutTemplate = getTemplateById(templateId) || null
          }

          if (workoutTemplate) {
            const sets = await getSetLogsForSession(activeSession.id)
            const totalSets = getTemplateTotalSets(workoutTemplate)
            const elapsed = Math.floor(
              (Date.now() - new Date(activeSession.startedAt).getTime()) / 60000
            )

            setDbWorkout({
              sessionId: activeSession.id,
              templateId: activeSession.templateId,
              template: workoutTemplate,
              completedSets: sets.length,
              totalSets,
              startedAt: activeSession.startedAt,
              elapsedMinutes: elapsed,
            })
          }
        } else {
          setDbWorkout(null)
        }
      } catch (error) {
        console.error('Error checking active workout:', error)
        setDbWorkout(null)
      }

      setIsLoading(false)
    }

    checkActiveWorkout()
  }, [isActive, sessionId, template])

  // Update elapsed time every minute
  useEffect(() => {
    const startTime = isActive && startedAt
      ? startedAt
      : dbWorkout?.startedAt
        ? new Date(dbWorkout.startedAt)
        : null

    if (!startTime) return

    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 60000)
      setElapsedTime(elapsed)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 60000)
    return () => clearInterval(interval)
  }, [isActive, startedAt, dbWorkout?.startedAt])

  const handleAbandon = async () => {
    try {
      // If store has active workout, use store's endWorkout
      if (isActive && sessionId) {
        const { endWorkout } = useWorkoutStore.getState()
        await endWorkout()
      }
      // If DB has orphan session, complete it directly
      else if (dbWorkout) {
        await db.sessions.update(dbWorkout.sessionId, {
          completedAt: new Date(),
          notes: 'Félbehagyva',
        })
      }

      setDbWorkout(null)
      setShowAbandonConfirm(false)
    } catch (error) {
      console.error('Error abandoning workout:', error)
    }
  }

  const handleContinue = () => {
    // If store has active workout, just navigate
    if (isActive && template) {
      navigate('/workout')
      return
    }

    // If DB has orphan session, navigate with template param to restore
    if (dbWorkout) {
      navigate(`/workout?template=${dbWorkout.templateId}&resume=${dbWorkout.sessionId}`)
    }
  }

  // Don't render if loading or no active workout
  if (isLoading) return null

  // Active workout from store
  const hasStoreWorkout = isActive && sessionId && template
  // Active workout from DB (orphan session)
  const hasDbWorkout = !hasStoreWorkout && dbWorkout

  if (!hasStoreWorkout && !hasDbWorkout) return null

  const activeTemplate = hasStoreWorkout ? template : dbWorkout?.template
  const activeCompletedSets = hasStoreWorkout ? completedSets.length : dbWorkout?.completedSets || 0
  const activeTotalSets = activeTemplate ? getTemplateTotalSets(activeTemplate) : 0
  const progressPercent = activeTotalSets > 0 ? (activeCompletedSets / activeTotalSets) * 100 : 0
  const color = MUSCLE_COLORS[activeTemplate?.muscleFocus || 'chest'] || '#ff4d00'

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mx-4 mb-4"
      >
        <div
          className="relative overflow-hidden border-2 border-accent bg-bg-secondary"
          style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
        >
          {/* Progress bar background */}
          <div
            className="absolute top-0 left-0 h-full bg-accent/10 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Content */}
          <div className="relative p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-display uppercase tracking-[0.2em] text-accent mb-1">
                  FOLYAMATBAN LÉVŐ EDZÉS
                </p>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary truncate">
                  {activeTemplate?.nameHu || 'Edzés'}
                </h3>
              </div>

              {/* Elapsed time badge */}
              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-xl font-bold text-accent">
                  {elapsedTime}
                  <span className="text-sm text-text-muted ml-1">perc</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="square" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono text-sm text-text-secondary">
                  {activeCompletedSets}/{activeTotalSets} sorozat
                </span>
              </div>

              <div className="flex-1 h-1.5 bg-bg-elevated">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleContinue}
                className="flex-1 py-3 bg-accent text-bg-primary font-display text-sm font-bold uppercase tracking-wider hover:bg-accent-hover transition-colors"
              >
                FOLYTATÁS
              </button>
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="px-4 py-3 border border-text-muted/30 text-text-muted font-display text-sm uppercase tracking-wider hover:border-danger hover:text-danger transition-colors"
              >
                MEGSZAKÍTÁS
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Abandon confirmation modal */}
      <AnimatePresence>
        {showAbandonConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-primary/95 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-bg-secondary border-2 border-text-muted/30 p-6 max-w-sm w-full"
            >
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-2">
                Edzés megszakítása?
              </h2>
              <p className="text-text-muted mb-6">
                {activeCompletedSets} sorozat rögzítve. Az edzés félbehagyottként lesz mentve.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="flex-1 py-3 border border-text-muted/30 text-text-secondary font-display text-sm uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
                >
                  Mégse
                </button>
                <button
                  onClick={handleAbandon}
                  className="flex-1 py-3 bg-danger text-white font-display text-sm font-bold uppercase tracking-wider hover:bg-danger/80 transition-colors"
                >
                  Megszakítás
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
