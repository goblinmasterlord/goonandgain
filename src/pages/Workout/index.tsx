import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWorkoutStore } from '@/stores'
import { SetLogger, RestTimer, ExerciseTransition, WorkoutSummary } from '@/components/workout'
import { Button } from '@/components/ui'
import { getTemplateTotalSets } from '@/data'

export function WorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    isActive,
    template,
    startWorkout,
    endWorkout,
    completedSets,
    currentExerciseIndex,
    showWorkoutSummary,
  } = useWorkoutStore()

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle starting workout from URL param
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId && !isActive) {
      const handleStart = async () => {
        setIsLoading(true)
        try {
          await startWorkout(templateId)
        } catch (error) {
          console.error('Failed to start workout:', error)
          navigate('/')
        } finally {
          setIsLoading(false)
        }
      }
      handleStart()
    }
  }, [searchParams, isActive, startWorkout, navigate])

  const handleEndWorkout = async () => {
    await endWorkout()
    navigate('/')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent animate-spin mx-auto mb-4" />
          </div>
          <p className="text-text-muted font-display uppercase tracking-wider">
            Edzés indítása...
          </p>
        </div>
      </div>
    )
  }

  // No active workout - show start prompt or redirect
  if (!isActive || !template) {
    return <NoActiveWorkout />
  }

  // Calculate progress
  const totalSets = getTemplateTotalSets(template)
  const completedSetCount = completedSets.length
  const progressPercent = totalSets > 0 ? (completedSetCount / totalSets) * 100 : 0

  // Check if workout is complete (after dismissing summary)
  const isWorkoutComplete = !showWorkoutSummary &&
    currentExerciseIndex >= template.exercises.length - 1 &&
    completedSets.filter((s) => s.exerciseId === template.exercises[template.exercises.length - 1]?.exerciseId).length >=
    (template.exercises[template.exercises.length - 1]?.targetSets || 0)

  return (
    <div className="min-h-screen bg-bg-primary relative">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-bg-primary/80 backdrop-blur-sm border-b border-text-muted/20">
        <div className="h-1 bg-bg-elevated">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-accent">
              {completedSetCount}/{totalSets}
            </span>
            <span className="text-text-muted text-2xs font-display uppercase tracking-wider">
              sorozat
            </span>
          </div>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="text-danger text-sm font-display uppercase tracking-wider hover:underline"
          >
            Befejezés
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16">
        {isWorkoutComplete ? (
          <WorkoutComplete
            template={template}
            completedSets={completedSetCount}
            onFinish={handleEndWorkout}
          />
        ) : (
          <SetLogger />
        )}
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer />

      {/* Exercise Transition Screen */}
      <ExerciseTransition />

      {/* Workout Summary Screen */}
      <WorkoutSummary />

      {/* End Workout Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-bg-primary/95 z-50 flex items-center justify-center p-6">
          <div className="bg-bg-secondary border-2 border-text-muted/30 p-6 max-w-sm w-full">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-4">
              Befejezed az edzést?
            </h2>
            <p className="text-text-muted mb-6">
              {completedSetCount} sorozat rögzítve {template.nameHu} edzésből.
            </p>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowEndConfirm(false)}
              >
                Vissza
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-danger hover:!bg-danger/80"
                onClick={handleEndWorkout}
              >
                Befejezés
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoActiveWorkout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-text-muted/30 flex items-center justify-center mb-6 mx-auto">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide mb-2">
          Nincs aktív edzés
        </h1>
        <p className="text-text-muted mb-8">
          Indíts egy edzést a főoldalról
        </p>
        <Button onClick={() => navigate('/')}>
          VISSZA A FŐOLDALRA
        </Button>
      </div>
    </div>
  )
}

interface WorkoutCompleteProps {
  template: { nameHu: string }
  completedSets: number
  onFinish: () => void
}

function WorkoutComplete({ template, completedSets, onFinish }: WorkoutCompleteProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
      <div className="text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-accent flex items-center justify-center mb-6 mx-auto">
          <svg className="w-10 h-10 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="square" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
          Kész!
        </h1>
        <p className="text-text-secondary mb-2">
          {template.nameHu} edzés befejezve
        </p>
        <p className="font-mono text-4xl text-accent font-bold mb-8">
          {completedSets} <span className="text-lg text-text-muted">sorozat</span>
        </p>

        <Button size="lg" onClick={onFinish} className="shadow-harsh">
          EDZÉS BEFEJEZÉSE
        </Button>
      </div>
    </div>
  )
}
