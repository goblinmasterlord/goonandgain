import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutStore } from '@/stores'
import { Button } from '@/components/ui'
import { allExercises, muscleGroups, equipmentTypes, getExerciseById } from '@/data'
import { cn } from '@/lib/utils/cn'
import type { Exercise, MuscleGroup } from '@/types'

const REST_OPTIONS = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2min' },
  { value: 180, label: '3min' },
]

export function AddExercisePrompt() {
  const {
    showAddExercisePrompt,
    transitionData,
    addQuickExercise,
    finishQuickWorkout,
    completedSets,
    template,
  } = useWorkoutStore()

  const [mode, setMode] = useState<'prompt' | 'picker' | 'config'>('prompt')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState(3)
  const [repMin, setRepMin] = useState(8)
  const [repMax, setRepMax] = useState(12)
  const [restSeconds, setRestSeconds] = useState(120)
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all')

  // Get already added exercise IDs
  const addedExerciseIds = template?.exercises.map((e) => e.exerciseId) || []

  // Get completed exercise info
  const completedExercise = transitionData?.completedExerciseId
    ? getExerciseById(transitionData.completedExerciseId) ?? null
    : null
  const completedSetsForExercise = transitionData?.completedExerciseSets || []
  const totalWeight = completedSetsForExercise.reduce(
    (sum, s) => sum + s.weightKg * s.reps,
    0
  )

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter((exercise) => {
      if (addedExerciseIds.includes(exercise.id)) return false
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName =
          exercise.nameHu.toLowerCase().includes(searchLower) ||
          exercise.nameEn.toLowerCase().includes(searchLower)
        if (!matchesName) return false
      }
      if (selectedMuscle !== 'all') {
        if (
          exercise.muscleGroupPrimary !== selectedMuscle &&
          !exercise.muscleGroupsSecondary.includes(selectedMuscle)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, selectedMuscle, addedExerciseIds])

  const mainMuscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes',
  ]

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setRepMin(exercise.defaultRepRangeMin)
    setRepMax(exercise.defaultRepRangeMax)
    setRestSeconds(exercise.type === 'compound' ? 180 : 90)
    setMode('config')
  }

  const handleAddExercise = async () => {
    if (!selectedExercise) return
    await addQuickExercise(selectedExercise.id, sets, repMin, repMax, restSeconds)
    // Reset state for next time
    setMode('prompt')
    setSelectedExercise(null)
    setSets(3)
    setSearch('')
    setSelectedMuscle('all')
  }

  const handleFinish = () => {
    finishQuickWorkout()
    setMode('prompt')
    setSelectedExercise(null)
  }

  const handleBack = () => {
    if (mode === 'config') {
      setMode('picker')
    } else if (mode === 'picker') {
      setMode('prompt')
      setSearch('')
      setSelectedMuscle('all')
    }
  }

  if (!showAddExercisePrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-bg-primary flex flex-col"
      >
        {mode === 'prompt' && (
          <PromptView
            completedExercise={completedExercise}
            completedSetsCount={completedSetsForExercise.length}
            totalWeight={totalWeight}
            totalExercises={template?.exercises.length || 0}
            totalSets={completedSets.length}
            onAddMore={() => setMode('picker')}
            onFinish={handleFinish}
          />
        )}

        {mode === 'picker' && (
          <ExercisePickerView
            search={search}
            setSearch={setSearch}
            selectedMuscle={selectedMuscle}
            setSelectedMuscle={setSelectedMuscle}
            filteredExercises={filteredExercises}
            mainMuscleGroups={mainMuscleGroups}
            onSelect={handleSelectExercise}
            onBack={handleBack}
          />
        )}

        {mode === 'config' && selectedExercise && (
          <ExerciseConfigView
            exercise={selectedExercise}
            sets={sets}
            setSets={setSets}
            repMin={repMin}
            setRepMin={setRepMin}
            repMax={repMax}
            setRepMax={setRepMax}
            restSeconds={restSeconds}
            setRestSeconds={setRestSeconds}
            onConfirm={handleAddExercise}
            onBack={handleBack}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Prompt view - shown after completing an exercise
function PromptView({
  completedExercise,
  completedSetsCount,
  totalWeight,
  totalExercises,
  totalSets,
  onAddMore,
  onFinish,
}: {
  completedExercise: Exercise | null
  completedSetsCount: number
  totalWeight: number
  totalExercises: number
  totalSets: number
  onAddMore: () => void
  onFinish: () => void
}) {
  const muscle = completedExercise
    ? muscleGroups.find((m) => m.id === completedExercise.muscleGroupPrimary)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <div className="w-16 h-16 bg-accent flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="square" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-text-primary mb-2">
          Gyakorlat kész!
        </h1>
        {completedExercise && (
          <p className="text-text-secondary">
            <span style={{ color: muscle?.color }}>{completedExercise.nameHu}</span>
            {' - '}{completedSetsCount} sorozat
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-accent">{totalExercises}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Gyakorlat</p>
          </div>
          <div className="p-4 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">{totalSets}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Sorozat</p>
          </div>
          <div className="p-4 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">
              {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)}t` : `${totalWeight}kg`}
            </p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Összsúly</p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-center mb-8">
          Folytassuk más<br />gyakorlattal?
        </h2>
      </div>

      {/* Actions */}
      <div className="px-4 pt-4 pb-6 pb-safe space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onAddMore}
        >
          GYAKORLAT HOZZÁADÁSA
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={onFinish}
        >
          EDZÉS BEFEJEZÉSE
        </Button>
      </div>
    </motion.div>
  )
}

// Exercise picker view
function ExercisePickerView({
  search,
  setSearch,
  selectedMuscle,
  setSelectedMuscle,
  filteredExercises,
  mainMuscleGroups,
  onSelect,
  onBack,
}: {
  search: string
  setSearch: (v: string) => void
  selectedMuscle: MuscleGroup | 'all'
  setSelectedMuscle: (v: MuscleGroup | 'all') => void
  filteredExercises: Exercise[]
  mainMuscleGroups: MuscleGroup[]
  onSelect: (exercise: Exercise) => void
  onBack: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-text-muted/20 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-display uppercase tracking-wider">Vissza</span>
        </button>
        <h2 className="font-display text-lg font-bold uppercase tracking-wide">
          Gyakorlat kiválasztása
        </h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-text-muted/10 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés..."
            className="input w-full pl-10"
            autoFocus
          />
        </div>
      </div>

      {/* Muscle filter */}
      <div className="px-4 py-3 border-b border-text-muted/10 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMuscle('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all',
              selectedMuscle === 'all'
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-elevated text-text-muted hover:text-text-primary'
            )}
          >
            Mind
          </button>
          {mainMuscleGroups.map((muscleId) => {
            const muscle = muscleGroups.find((m) => m.id === muscleId)
            if (!muscle) return null
            return (
              <button
                key={muscleId}
                onClick={() => setSelectedMuscle(muscleId)}
                className={cn(
                  'px-3 py-1.5 text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all',
                  selectedMuscle === muscleId
                    ? 'text-bg-primary'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                )}
                style={selectedMuscle === muscleId ? { backgroundColor: muscle.color } : undefined}
              >
                {muscle.nameHu}
              </button>
            )
          })}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">Nincs találat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((exercise) => {
              const muscle = muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)
              const equipment = equipmentTypes.find((e) => e.id === exercise.equipment)

              return (
                <button
                  key={exercise.id}
                  onClick={() => onSelect(exercise)}
                  className="w-full text-left p-4 bg-bg-secondary border border-text-muted/20 hover:border-accent/50 transition-all flex items-center gap-4"
                >
                  <div className="w-1 h-12 flex-shrink-0" style={{ backgroundColor: muscle?.color }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-text-primary uppercase tracking-wide truncate">
                      {exercise.nameHu}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xs uppercase tracking-wider" style={{ color: muscle?.color }}>
                        {muscle?.nameHu}
                      </span>
                      <span className="text-text-muted">·</span>
                      <span className="text-2xs text-text-muted">{equipment?.nameHu}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Exercise config view
function ExerciseConfigView({
  exercise,
  sets,
  setSets,
  repMin,
  setRepMin,
  repMax,
  setRepMax,
  restSeconds,
  setRestSeconds,
  onConfirm,
  onBack,
}: {
  exercise: Exercise
  sets: number
  setSets: (v: number) => void
  repMin: number
  setRepMin: (v: number) => void
  repMax: number
  setRepMax: (v: number) => void
  restSeconds: number
  setRestSeconds: (v: number) => void
  onConfirm: () => void
  onBack: () => void
}) {
  const muscle = muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b-2 border-text-muted/20 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-display uppercase tracking-wider">Vissza</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10" style={{ backgroundColor: muscle?.color }} />
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              {exercise.nameHu}
            </h2>
            <p className="text-2xs text-text-muted uppercase tracking-wider">
              {muscle?.nameHu} · {exercise.type === 'compound' ? 'Összetett' : 'Izolált'}
            </p>
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {/* Sets */}
        <div>
          <label className="label mb-4 block text-center">Sorozatok száma</label>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setSets(Math.max(1, sets - 1))}
              className="w-14 h-14 bg-bg-elevated border-2 border-text-muted/30 text-text-primary hover:border-accent transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" d="M20 12H4" />
              </svg>
            </button>
            <span className="font-mono text-5xl font-bold text-accent w-20 text-center">
              {sets}
            </span>
            <button
              onClick={() => setSets(Math.min(10, sets + 1))}
              className="w-14 h-14 bg-bg-elevated border-2 border-text-muted/30 text-text-primary hover:border-accent transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Rep range */}
        <div>
          <label className="label mb-4 block text-center">Ismétlések</label>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-2xs text-text-muted mb-2">Min</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRepMin(Math.max(1, repMin - 1))}
                  className="w-10 h-10 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-mono text-3xl font-bold text-text-primary w-12 text-center">
                  {repMin}
                </span>
                <button
                  onClick={() => setRepMin(Math.min(repMax - 1, repMin + 1))}
                  className="w-10 h-10 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <span className="text-text-muted text-3xl mt-6">—</span>

            <div className="flex flex-col items-center">
              <span className="text-2xs text-text-muted mb-2">Max</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRepMax(Math.max(repMin + 1, repMax - 1))}
                  className="w-10 h-10 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-mono text-3xl font-bold text-text-primary w-12 text-center">
                  {repMax}
                </span>
                <button
                  onClick={() => setRepMax(Math.min(30, repMax + 1))}
                  className="w-10 h-10 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rest time */}
        <div>
          <label className="label mb-4 block text-center">Pihenőidő</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {REST_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRestSeconds(option.value)}
                className={cn(
                  'px-5 py-3 font-mono text-base transition-all',
                  restSeconds === option.value
                    ? 'bg-accent text-bg-primary font-bold'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary border border-text-muted/30 hover:border-accent'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pt-4 pb-6 pb-safe border-t-2 border-text-muted/20 flex-shrink-0 bg-bg-primary">
        <div className="p-3 bg-bg-secondary border border-text-muted/20 mb-4">
          <p className="text-center text-text-secondary">
            <span className="font-mono font-bold text-accent text-lg">{sets}</span>
            <span className="text-text-muted"> × </span>
            <span className="font-mono font-bold text-lg">{repMin}-{repMax}</span>
            <span className="text-text-muted"> ism. · </span>
            <span className="font-mono">{restSeconds >= 60 ? `${Math.floor(restSeconds / 60)}:${(restSeconds % 60).toString().padStart(2, '0')}` : `${restSeconds}s`}</span>
            <span className="text-text-muted"> pihenő</span>
          </p>
        </div>
        <Button variant="primary" className="w-full" onClick={onConfirm}>
          KEZDJÜK!
        </Button>
      </div>
    </motion.div>
  )
}
