import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useWorkoutStore } from '@/stores'
import { SetLogger, RestTimer, ExerciseTransition, WorkoutSummary, AddExercisePrompt } from '@/components/workout'
import { Button } from '@/components/ui'
import { getTemplateTotalSets, getTemplateEstimatedDuration, getTemplateById, getExerciseById } from '@/data'
import { isCustomTemplateId, getCustomTemplateNumericId, getCustomTemplateById, customTemplateToWorkoutTemplate } from '@/lib/db'
import type { WorkoutTemplate } from '@/types'

export function WorkoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    isActive,
    template,
    startWorkout,
    startQuickWorkout,
    endWorkout,
    completedSets,
    currentExerciseIndex,
    showWorkoutSummary,
    isQuickWorkout,
  } = useWorkoutStore()

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null)

  // Load template for preview from URL param
  useEffect(() => {
    async function loadTemplatePreview() {
      const templateId = searchParams.get('template')
      if (!templateId || isActive) return

      // Check if this is a quick workout
      if (templateId === 'quick') {
        // Start quick workout immediately
        setIsLoading(true)
        try {
          await startQuickWorkout()
        } catch (error) {
          console.error('Failed to start quick workout:', error)
          navigate('/')
        } finally {
          setIsLoading(false)
        }
        return
      }

      // Check if this is a custom template
      if (isCustomTemplateId(templateId)) {
        const numericId = getCustomTemplateNumericId(templateId)
        if (numericId) {
          const customTemplate = await getCustomTemplateById(numericId)
          if (customTemplate) {
            setPreviewTemplate(customTemplateToWorkoutTemplate(customTemplate))
            return
          }
        }
        navigate('/')
      } else {
        const tmpl = getTemplateById(templateId)
        if (tmpl) {
          setPreviewTemplate(tmpl)
        } else {
          navigate('/')
        }
      }
    }

    loadTemplatePreview()
  }, [searchParams, isActive, navigate, startQuickWorkout])

  const handleStartWorkout = async () => {
    const templateId = searchParams.get('template')
    if (!templateId) return

    setIsLoading(true)
    try {
      await startWorkout(templateId)
      setPreviewTemplate(null)
    } catch (error) {
      console.error('Failed to start workout:', error)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

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

  // Show workout preview before starting
  if (previewTemplate && !isActive) {
    return (
      <WorkoutPreview
        template={previewTemplate}
        onStart={handleStartWorkout}
        onBack={() => navigate('/')}
      />
    )
  }

  // No active workout - show start prompt or redirect
  if (!isActive || !template) {
    return <NoActiveWorkout />
  }

  // Calculate progress (for quick workout, show just completed sets)
  const totalSets = isQuickWorkout ? completedSets.length : getTemplateTotalSets(template)
  const completedSetCount = completedSets.length
  const progressPercent = isQuickWorkout ? 100 : (totalSets > 0 ? (completedSetCount / totalSets) * 100 : 0)

  // Check if workout is complete (after dismissing summary) - not applicable for quick workouts
  const isWorkoutComplete = !isQuickWorkout && !showWorkoutSummary &&
    currentExerciseIndex >= template.exercises.length - 1 &&
    completedSets.filter((s) => s.exerciseId === template.exercises[template.exercises.length - 1]?.exerciseId).length >=
    (template.exercises[template.exercises.length - 1]?.targetSets || 0)

  // For quick workout with no exercises yet, just show the add exercise prompt
  const hasNoExercises = template.exercises.length === 0

  return (
    <div className="min-h-screen bg-bg-primary relative">
      {/* Top Progress Bar - hide for quick workout with no exercises */}
      {!hasNoExercises && (
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
                {isQuickWorkout ? completedSetCount : `${completedSetCount}/${totalSets}`}
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
      )}

      {/* Main Content */}
      <div className={hasNoExercises ? '' : 'pt-16'}>
        {isWorkoutComplete ? (
          <WorkoutComplete
            template={template}
            completedSets={completedSetCount}
            onFinish={handleEndWorkout}
          />
        ) : !hasNoExercises ? (
          <SetLogger />
        ) : null}
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer />

      {/* Exercise Transition Screen */}
      <ExerciseTransition />

      {/* Workout Summary Screen */}
      <WorkoutSummary />

      {/* Add Exercise Prompt (for quick workouts) */}
      <AddExercisePrompt />

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

// Muscle colors for exercise list
const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ff4d00',
  back: '#0066ff',
  shoulders: '#9333ea',
  biceps: '#ff0066',
  triceps: '#ff0066',
  quads: '#00d4aa',
  hamstrings: '#00d4aa',
  glutes: '#00d4aa',
  calves: '#00d4aa',
  core: '#8a8a8a',
  push: '#f97316',
  pull: '#22d3ee',
  legs: '#00d4aa',
}

interface WorkoutPreviewProps {
  template: WorkoutTemplate
  onStart: () => void
  onBack: () => void
}

function WorkoutPreview({ template, onStart, onBack }: WorkoutPreviewProps) {
  const totalSets = getTemplateTotalSets(template)
  const duration = getTemplateEstimatedDuration(template)
  const color = MUSCLE_COLORS[template.muscleFocus] || '#ff4d00'

  return (
    <div className="min-h-screen bg-bg-primary pb-40">
      {/* Header */}
      <header className="px-4 pt-5 pb-4 border-b-2 border-text-muted/20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-display uppercase tracking-wider">Vissza</span>
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-1.5 h-12 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide">
              {template.nameHu}
            </h1>
            <p className="text-text-muted text-sm mt-0.5">
              {template.exercises.length} gyakorlat
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-4 border-b border-text-muted/10">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-accent">{template.exercises.length}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Gyakorlat</p>
          </div>
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{totalSets}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Sorozat</p>
          </div>
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">~{duration}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Perc</p>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-4">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-3">
          Gyakorlatok
        </h2>
        <div className="space-y-2">
          {template.exercises.map((exerciseItem, index) => {
            const exercise = getExerciseById(exerciseItem.exerciseId)
            if (!exercise) return null

            const muscleColor = MUSCLE_COLORS[exercise.muscleGroupPrimary] || '#8a8a8a'

            return (
              <div
                key={exerciseItem.exerciseId}
                className="p-3 bg-bg-secondary border border-text-muted/20 flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
                  style={{ backgroundColor: `${muscleColor}20`, color: muscleColor }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-text-primary truncate">
                    {exercise.nameHu}
                  </p>
                  <p className="text-2xs text-text-muted">
                    {exerciseItem.targetSets} × {exerciseItem.targetRepMin}-{exerciseItem.targetRepMax} ism.
                  </p>
                </div>
                <Link
                  to={`/exercises/${exercise.id}`}
                  className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-all flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="square" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Start Button - Fixed above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 p-4 pb-safe bg-bg-primary border-t border-text-muted/20">
        <Button
          size="lg"
          className="w-full shadow-harsh"
          onClick={onStart}
        >
          EDZÉS INDÍTÁSA
        </Button>
      </div>
    </div>
  )
}
