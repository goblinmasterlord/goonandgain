import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutStore } from '@/stores'
import { getExerciseById, muscleGroups, equipmentTypes } from '@/data'
import { Button, InfoTooltip } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { calculateOverloadSuggestion, formatLastSessionDisplay } from '@/lib/workout'
import type { RIR, WorkoutTemplate, SetLog } from '@/types'

export function SetLogger() {
  const {
    template,
    currentExerciseIndex,
    currentSetNumber,
    lastSessionSets,
    weightInput,
    repsInput,
    rirInput,
    addedWeightInput,
    setWeight,
    setReps,
    setRir,
    setAddedWeight,
    logCurrentSet,
    skipSet,
    completedSets,
    sessionId,
  } = useWorkoutStore()

  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showSkipToast, setShowSkipToast] = useState(false)
  const [skippedSetNumber, setSkippedSetNumber] = useState<number | null>(null)
  const [showOverviewModal, setShowOverviewModal] = useState(false)

  // Auto-hide skip toast after 2 seconds
  useEffect(() => {
    if (showSkipToast) {
      const timer = setTimeout(() => {
        setShowSkipToast(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showSkipToast])

  const handleSkipSet = () => {
    setSkippedSetNumber(currentSetNumber)
    setShowSkipToast(true)
    skipSet()
  }

  if (!template) return null

  const currentTemplateExercise = template.exercises[currentExerciseIndex]
  if (!currentTemplateExercise) return null

  const exercise = getExerciseById(currentTemplateExercise.exerciseId)
  if (!exercise) return null

  const primaryMuscle = muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)
  const equipment = equipmentTypes.find((e) => e.id === exercise.equipment)

  // Get completed sets for this exercise in current session
  const setsCompletedThisExercise = completedSets.filter(
    (s) => s.exerciseId === exercise.id && s.sessionId === sessionId
  ).length

  // Calculate overload suggestion using the progressive overload engine
  const overloadSuggestion = useMemo(() => {
    return calculateOverloadSuggestion(
      exercise,
      lastSessionSets,
      currentTemplateExercise.targetRepMin,
      currentTemplateExercise.targetRepMax
    )
  }, [exercise, lastSessionSets, currentTemplateExercise])

  // Format last session display
  const lastSessionDisplay = useMemo(() => {
    return formatLastSessionDisplay(lastSessionSets)
  }, [lastSessionSets])

  const canLogSet = weightInput && repsInput && rirInput !== null

  const rirOptions: RIR[] = [0, 1, 2, 3, 4]

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Exercise Header */}
      <header className="px-5 pt-6 pb-4 border-b-2 border-text-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-12"
              style={{ backgroundColor: primaryMuscle?.color }}
            />
            <div>
              <button
                onClick={() => setShowOverviewModal(true)}
                className="text-2xs font-display uppercase tracking-[0.3em] text-text-muted hover:text-accent transition-colors flex items-center gap-1"
              >
                {template.nameHu} - {currentExerciseIndex + 1}/{template.exercises.length}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-text-primary">
                {exercise.nameHu}
              </h1>
            </div>
          </div>
          <Link
            to={`/exercises/${exercise.id}`}
            className="px-3 py-1.5 border border-text-muted/30 text-2xs font-display uppercase tracking-wider text-text-muted hover:text-accent hover:border-accent transition-colors"
          >
            INFO
          </Link>
        </div>

        {/* Set progress indicator */}
        <div className="flex gap-1">
          {Array.from({ length: currentTemplateExercise.targetSets }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 transition-all duration-200',
                i < setsCompletedThisExercise
                  ? 'bg-accent'
                  : i === setsCompletedThisExercise
                    ? 'bg-accent/50'
                    : 'bg-text-muted/20'
              )}
            />
          ))}
        </div>
      </header>

      {/* Set Info */}
      <div className="px-5 py-4 border-b border-text-muted/10 bg-bg-secondary/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-1">
              Sorozat
            </p>
            <p className="font-mono text-3xl font-bold text-text-primary">
              {currentSetNumber}
              <span className="text-text-muted text-lg">/{currentTemplateExercise.targetSets}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-1">
              {equipment?.nameHu}
            </p>
            <p className={cn(
              'font-display text-sm uppercase tracking-wider',
              exercise.type === 'compound' ? 'text-accent' : 'text-text-secondary'
            )}>
              {exercise.type === 'compound' ? 'Összetett' : 'Izolált'}
            </p>
          </div>
        </div>
      </div>

      {/* Last Session & Target */}
      <div className="px-5 py-4 space-y-3 border-b border-text-muted/10">
        {lastSessionDisplay && (
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-2xs font-display uppercase tracking-wider w-20">
              Előző:
            </span>
            <span className="font-mono text-lg text-text-secondary">
              {lastSessionDisplay}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-2xs font-display uppercase tracking-wider w-20',
            overloadSuggestion.messageType === 'progress' ? 'text-success' :
            overloadSuggestion.messageType === 'easy' ? 'text-warning' :
            overloadSuggestion.messageType === 'reduce' ? 'text-danger' : 'text-accent'
          )}>
            Célod:
          </span>
          <span className="font-mono text-lg text-accent font-bold">
            {overloadSuggestion.suggestedWeight > 0 ? `${overloadSuggestion.suggestedWeight}kg` : '—'} x {overloadSuggestion.targetReps.min}-{overloadSuggestion.targetReps.max}
          </span>
          <span className="text-text-muted text-sm">@ RIR 2</span>
        </div>
        {/* Overload message */}
        <p className={cn(
          'text-sm',
          overloadSuggestion.messageType === 'progress' ? 'text-success' :
          overloadSuggestion.messageType === 'easy' ? 'text-warning' :
          overloadSuggestion.messageType === 'reduce' ? 'text-danger' : 'text-text-muted'
        )}>
          {overloadSuggestion.message}
        </p>
      </div>

      {/* Input Section */}
      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Weight Input */}
        <div>
          <label className="label">Súly (kg)</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-4 bg-bg-secondary border-2 border-text-muted/30 font-mono text-2xl text-center text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none transition-colors"
              placeholder={overloadSuggestion.suggestedWeight > 0 ? overloadSuggestion.suggestedWeight.toString() : '0'}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-display text-sm uppercase">
              KG
            </span>
          </div>
          {/* Quick adjust buttons */}
          <div className="flex gap-2 mt-2">
            {[-5, -2.5, 2.5, 5].map((delta) => (
              <button
                key={delta}
                onClick={() => {
                  const current = parseFloat(weightInput) || overloadSuggestion.suggestedWeight || 0
                  setWeight((current + delta).toString())
                }}
                className="flex-1 py-2 border border-text-muted/30 text-text-muted font-mono text-sm hover:border-accent hover:text-accent transition-colors"
              >
                {delta > 0 ? '+' : ''}{delta}
              </button>
            ))}
          </div>
        </div>

        {/* Added Weight for Bodyweight Exercises */}
        {exercise.isBodyweight && (
          <div>
            <label className="label">Hozzáadott súly (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              value={addedWeightInput}
              onChange={(e) => setAddedWeight(e.target.value)}
              className="w-full p-4 bg-bg-secondary border-2 border-text-muted/30 font-mono text-xl text-center text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>
        )}

        {/* Reps Input */}
        <div>
          <label className="label">Ismétlések</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={repsInput}
              onChange={(e) => setReps(e.target.value)}
              className="w-full p-4 bg-bg-secondary border-2 border-text-muted/30 font-mono text-2xl text-center text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none transition-colors"
              placeholder={`${overloadSuggestion.targetReps.min}-${overloadSuggestion.targetReps.max}`}
            />
          </div>
          {/* Quick rep buttons */}
          <div className="flex gap-2 mt-2">
            {[6, 8, 10, 12, 15].map((rep) => (
              <button
                key={rep}
                onClick={() => setReps(rep.toString())}
                className={cn(
                  'flex-1 py-2 border font-mono text-sm transition-colors',
                  repsInput === rep.toString()
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-text-muted/30 text-text-muted hover:border-accent hover:text-accent'
                )}
              >
                {rep}
              </button>
            ))}
          </div>
        </div>

        {/* RIR Input */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="label mb-0">RIR</label>
            <InfoTooltip
              content={
                <div className="space-y-2">
                  <p className="font-display text-xs uppercase tracking-wider text-accent mb-1">
                    Reps In Reserve
                  </p>
                  <p>
                    Mennyi ismétlést tudtál volna még megcsinálni a sorozat végén?
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li><span className="font-mono text-danger font-bold">RIR 0</span> = Kimerülés, nem ment volna több</li>
                    <li><span className="font-mono text-danger">RIR 1</span> = Majdnem max, 1 maradt</li>
                    <li><span className="font-mono text-accent">RIR 2</span> = Ideális edzésintenzitás</li>
                    <li><span className="font-mono text-warning">RIR 3</span> = Könnyű, növelj súlyt</li>
                    <li><span className="font-mono text-text-muted">RIR 4+</span> = Túl könnyű</li>
                  </ul>
                </div>
              }
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {rirOptions.map((rir) => (
              <button
                key={rir}
                onClick={() => setRir(rir)}
                className={cn(
                  'py-4 border-2 font-mono text-xl font-bold transition-all duration-100',
                  rirInput === rir
                    ? rir === 0
                      ? 'border-danger bg-danger text-white shadow-harsh'
                      : 'border-accent bg-accent text-bg-primary shadow-harsh'
                    : rir === 0
                      ? 'border-danger/50 text-danger hover:border-danger hover:bg-danger/10'
                      : 'border-text-muted/30 text-text-secondary hover:border-accent hover:text-accent'
                )}
              >
                {rir === 4 ? '4+' : rir}
              </button>
            ))}
          </div>
          <p className="text-2xs text-text-muted mt-2 text-center">
            {rirInput === 0 && 'Teljes kimerülés - nem ment volna több sehogy sem'}
            {rirInput === 1 && 'Nagyon nehéz volt, alig bírtad volna még egyet'}
            {rirInput === 2 && 'Ideális - még 2 bírt volna menni'}
            {rirInput === 3 && 'Könnyen ment, növelj súlyt!'}
            {rirInput === 4 && 'Túl könnyű - határozottan növelj súlyt'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-8 pt-4 border-t border-text-muted/20 bg-bg-secondary/50">
        <Button
          size="lg"
          className="w-full mb-4"
          disabled={!canLogSet}
          onClick={logCurrentSet}
        >
          SOROZAT RÖGZÍTÉSE
        </Button>

        <div className="flex gap-4">
          <button
            onClick={() => setShowSwapModal(true)}
            className="flex-1 py-3 border border-text-muted/30 text-text-muted font-display text-sm uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
          >
            Csere
          </button>
          <button
            onClick={handleSkipSet}
            className="flex-1 py-3 border border-text-muted/30 text-text-muted font-display text-sm uppercase tracking-wider hover:border-danger hover:text-danger transition-colors"
          >
            Kihagyás
          </button>
        </div>
      </div>

      {/* Skip Toast Notification */}
      <AnimatePresence>
        {showSkipToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-danger px-6 py-3 shadow-harsh flex items-center gap-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-display text-sm uppercase tracking-wider text-white font-semibold">
                {skippedSetNumber}. sorozat kihagyva
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Modal */}
      {showSwapModal && (
        <SwapExerciseModal
          exerciseId={exercise.id}
          onClose={() => setShowSwapModal(false)}
        />
      )}

      {/* Workout Overview Modal */}
      {showOverviewModal && template && (
        <WorkoutOverviewModal
          template={template}
          currentExerciseIndex={currentExerciseIndex}
          completedSets={completedSets}
          sessionId={sessionId}
          onClose={() => setShowOverviewModal(false)}
        />
      )}
    </div>
  )
}

interface SwapExerciseModalProps {
  exerciseId: string
  onClose: () => void
}

function SwapExerciseModal({ exerciseId, onClose }: SwapExerciseModalProps) {
  const { swapExercise } = useWorkoutStore()
  const exercise = getExerciseById(exerciseId)

  if (!exercise) return null

  const alternatives = exercise.alternativeExerciseIds
    .map((id) => getExerciseById(id))
    .filter(Boolean)

  return (
    <div className="fixed inset-0 bg-bg-primary/95 z-50 flex flex-col">
      <header className="px-5 pt-6 pb-4 border-b border-text-muted/20 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider">
          Gyakorlat cseréje
        </h2>
        <button onClick={onClose} className="p-2 text-text-muted hover:text-accent">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-auto px-5 py-4">
        <p className="text-text-muted text-sm mb-4">
          Válassz egy alternatív gyakorlatot:
        </p>

        <div className="space-y-2">
          {alternatives.map((alt) => {
            if (!alt) return null
            const muscle = muscleGroups.find((m) => m.id === alt.muscleGroupPrimary)

            return (
              <button
                key={alt.id}
                onClick={() => {
                  swapExercise(alt.id)
                  onClose()
                }}
                className="w-full p-4 border border-text-muted/20 bg-bg-secondary hover:border-accent transition-colors flex items-center gap-4 text-left"
              >
                <div
                  className="w-1 h-10"
                  style={{ backgroundColor: muscle?.color }}
                />
                <div>
                  <p className="font-display font-semibold text-text-primary">
                    {alt.nameHu}
                  </p>
                  <p className="text-2xs text-text-muted uppercase tracking-wider">
                    {equipmentTypes.find((e) => e.id === alt.equipment)?.nameHu}
                  </p>
                </div>
              </button>
            )
          })}

          {alternatives.length === 0 && (
            <p className="text-center text-text-muted py-8">
              Nincs elérhető alternatíva
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Muscle colors map
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
}

interface WorkoutOverviewModalProps {
  template: WorkoutTemplate
  currentExerciseIndex: number
  completedSets: SetLog[]
  sessionId: number | null
  onClose: () => void
}

function WorkoutOverviewModal({
  template,
  currentExerciseIndex,
  completedSets,
  sessionId,
  onClose,
}: WorkoutOverviewModalProps) {
  return (
    <div className="fixed inset-0 bg-bg-primary/95 z-50 flex flex-col">
      <header className="px-5 pt-6 pb-4 border-b border-text-muted/20 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider">
          {template.nameHu}
        </h2>
        <button onClick={onClose} className="p-2 text-text-muted hover:text-accent">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-auto px-5 py-4">
        <p className="text-text-muted text-sm mb-4">
          Edzés áttekintése ({currentExerciseIndex + 1}/{template.exercises.length} gyakorlat)
        </p>

        <div className="space-y-2">
          {template.exercises.map((exerciseItem, index) => {
            const exercise = getExerciseById(exerciseItem.exerciseId)
            if (!exercise) return null

            const muscleColor = MUSCLE_COLORS[exercise.muscleGroupPrimary] || '#8a8a8a'

            // Count completed sets for this exercise
            const exerciseCompletedSets = completedSets.filter(
              (s) => s.exerciseId === exercise.id && s.sessionId === sessionId
            ).length

            const isCompleted = exerciseCompletedSets >= exerciseItem.targetSets
            const isCurrent = index === currentExerciseIndex
            const isPending = index > currentExerciseIndex

            return (
              <div
                key={exerciseItem.exerciseId}
                className={cn(
                  'p-4 border flex items-center gap-3',
                  isCurrent
                    ? 'border-accent bg-accent/10'
                    : isCompleted
                      ? 'border-success/50 bg-success/5'
                      : 'border-text-muted/20 bg-bg-secondary'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold',
                    isCompleted && 'bg-success/20 text-success',
                    isCurrent && 'bg-accent/20 text-accent',
                    isPending && 'bg-text-muted/10 text-text-muted'
                  )}
                  style={!isCompleted && !isCurrent ? {} : { backgroundColor: `${muscleColor}20`, color: muscleColor }}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-display text-sm font-semibold truncate',
                    isCompleted ? 'text-success' : isCurrent ? 'text-accent' : 'text-text-primary'
                  )}>
                    {exercise.nameHu}
                  </p>
                  <p className="text-2xs text-text-muted">
                    {exerciseCompletedSets}/{exerciseItem.targetSets} sorozat
                    {' • '}
                    {exerciseItem.targetRepMin}-{exerciseItem.targetRepMax} ism.
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-2xs font-display uppercase tracking-wider text-accent px-2 py-1 border border-accent">
                    MOST
                  </span>
                )}
                <Link
                  to={`/exercises/${exercise.id}`}
                  className="p-2 border border-text-muted/30 text-text-muted hover:text-accent hover:border-accent transition-colors"
                  title="Gyakorlat részletei"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="square" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
