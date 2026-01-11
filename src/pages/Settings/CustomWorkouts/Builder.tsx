import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  createCustomTemplate,
  updateCustomTemplate,
  getCustomTemplateById,
} from '@/lib/db'
import { queueSync, isSupabaseConfigured } from '@/lib/sync'
import { getExerciseById, allExercises, muscleGroups, equipmentTypes } from '@/data'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { TemplateExercise, WorkoutType, Exercise, DayOfWeek, MuscleGroup } from '@/types'
import { DAY_ABBREV_HU } from '@/types'

// Muscle focus options
const MUSCLE_FOCUS_OPTIONS: { id: WorkoutType; nameHu: string; color: string }[] = [
  { id: 'chest', nameHu: 'Mell', color: '#ff4d00' },
  { id: 'back', nameHu: 'Hát', color: '#0066ff' },
  { id: 'shoulders', nameHu: 'Váll', color: '#9333ea' },
  { id: 'arms', nameHu: 'Kar', color: '#ff0066' },
  { id: 'legs', nameHu: 'Láb', color: '#00d4aa' },
  { id: 'push', nameHu: 'Push', color: '#f97316' },
  { id: 'pull', nameHu: 'Pull', color: '#22d3ee' },
]

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

const REST_OPTIONS = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2min' },
  { value: 180, label: '3min' },
  { value: 240, label: '4min' },
]

type Step = 'basics' | 'days' | 'exercises' | 'review'

const STEPS: { id: Step; label: string }[] = [
  { id: 'basics', label: 'Alapok' },
  { id: 'days', label: 'Napok' },
  { id: 'exercises', label: 'Gyakorlatok' },
  { id: 'review', label: 'Áttekintés' },
]

export function CustomWorkoutBuilderPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = id && id !== 'new'

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('basics')

  // Form state
  const [name, setName] = useState('')
  const [muscleFocus, setMuscleFocus] = useState<WorkoutType>('chest')
  const [exercises, setExercises] = useState<TemplateExercise[]>([])
  const [assignedDays, setAssignedDays] = useState<number[]>([])

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(!!isEditing)

  // Load existing template if editing
  useEffect(() => {
    if (isEditing && id) {
      loadTemplate()
    }
  }, [id, isEditing])

  const loadTemplate = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const template = await getCustomTemplateById(parseInt(id, 10))
      if (template) {
        setName(template.nameHu)
        setMuscleFocus(template.muscleFocus)
        setExercises(template.exercises)
        setAssignedDays(template.assignedDays)
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const focusColor = MUSCLE_FOCUS_OPTIONS.find((m) => m.id === muscleFocus)?.color || '#8a8a8a'

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return name.trim().length > 0
      case 'days':
        return true // Days are optional
      case 'exercises':
        return exercises.length > 0
      case 'review':
        return true
      default:
        return false
    }
  }

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return

    setIsSaving(true)
    try {
      const orderedExercises = exercises.map((ex, i) => ({ ...ex, order: i + 1 }))
      const now = new Date()

      if (isEditing && id) {
        const numericId = parseInt(id, 10)
        await updateCustomTemplate(numericId, {
          nameHu: name.trim(),
          muscleFocus,
          exercises: orderedExercises,
          assignedDays,
        })
        if (isSupabaseConfigured()) {
          await queueSync('custom_templates', 'update', numericId, {
            nameHu: name.trim(),
            muscleFocus,
            exercises: orderedExercises,
            assignedDays,
            updatedAt: now,
          })
        }
      } else {
        const newId = await createCustomTemplate(name.trim(), muscleFocus, orderedExercises, assignedDays)
        if (isSupabaseConfigured()) {
          await queueSync('custom_templates', 'insert', newId, {
            nameHu: name.trim(),
            muscleFocus,
            exercises: orderedExercises,
            assignedDays,
            createdAt: now,
            updatedAt: now,
          })
        }
      }
      navigate('/settings/custom-workouts')
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Hiba történt a mentés során!')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDay = (day: number) => {
    setAssignedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleAddExercise = (config: Omit<TemplateExercise, 'order'>) => {
    setExercises((prev) => [...prev, { ...config, order: prev.length + 1 }])
  }

  const handleUpdateExercise = (index: number, config: Omit<TemplateExercise, 'order'>) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...config, order: ex.order } : ex))
    )
  }

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-bg-primary flex flex-col z-50">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20 flex-shrink-0">
        <button
          onClick={() => navigate('/settings/custom-workouts')}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-display uppercase tracking-wider">Mégse</span>
        </button>
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">
          {isEditing ? 'Edzés szerkesztése' : 'Új edzés'}
        </h1>
      </header>

      {/* Progress indicator */}
      <div className="px-4 py-3 border-b border-text-muted/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => {
                  // Allow going back to previous steps
                  if (index <= currentStepIndex) {
                    setCurrentStep(step.id)
                  }
                }}
                className={cn(
                  'flex items-center gap-2 transition-all',
                  index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 flex items-center justify-center font-mono text-sm font-bold transition-all',
                    index < currentStepIndex
                      ? 'bg-accent text-bg-primary'
                      : index === currentStepIndex
                      ? 'border-2 border-accent text-accent'
                      : 'border border-text-muted/30 text-text-muted'
                  )}
                >
                  {index < currentStepIndex ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-2xs font-display uppercase tracking-wider hidden sm:block',
                    index === currentStepIndex ? 'text-accent' : 'text-text-muted'
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 transition-all',
                    index < currentStepIndex ? 'bg-accent' : 'bg-text-muted/20'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep === 'basics' && (
            <StepBasics
              key="basics"
              name={name}
              setName={setName}
              muscleFocus={muscleFocus}
              setMuscleFocus={setMuscleFocus}
            />
          )}
          {currentStep === 'days' && (
            <StepDays
              key="days"
              assignedDays={assignedDays}
              toggleDay={toggleDay}
            />
          )}
          {currentStep === 'exercises' && (
            <StepExercises
              key="exercises"
              exercises={exercises}
              setExercises={setExercises}
              focusColor={focusColor}
              onAdd={handleAddExercise}
              onUpdate={handleUpdateExercise}
              onRemove={handleRemoveExercise}
            />
          )}
          {currentStep === 'review' && (
            <StepReview
              key="review"
              name={name}
              muscleFocus={muscleFocus}
              exercises={exercises}
              setExercises={setExercises}
              assignedDays={assignedDays}
              focusColor={focusColor}
              onRemove={handleRemoveExercise}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="px-4 py-4 border-t-2 border-text-muted/20 flex-shrink-0 bg-bg-primary">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button variant="secondary" className="flex-1" onClick={goToPrevStep}>
              Vissza
            </Button>
          )}
          {currentStep === 'review' ? (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving || !name.trim() || exercises.length === 0}
            >
              {isSaving ? 'Mentés...' : isEditing ? 'MENTÉS' : 'LÉTREHOZÁS'}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              onClick={goToNextStep}
              disabled={!canProceed()}
            >
              Tovább
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 1: Basic Info
function StepBasics({
  name,
  setName,
  muscleFocus,
  setMuscleFocus,
}: {
  name: string
  setName: (v: string) => void
  muscleFocus: WorkoutType
  setMuscleFocus: (v: WorkoutType) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="space-y-8">
        {/* Name input */}
        <div>
          <label className="label mb-3 block">Edzés neve</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pl. Push nap, Felső test..."
            className="input w-full text-lg"
            autoFocus
          />
          <p className="text-2xs text-text-muted mt-2">
            Adj egy könnyen felismerhető nevet az edzésednek
          </p>
        </div>

        {/* Muscle focus */}
        <div>
          <label className="label mb-3 block">Fő izomcsoport</label>
          <div className="grid grid-cols-2 gap-2">
            {MUSCLE_FOCUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setMuscleFocus(option.id)}
                className={cn(
                  'p-4 text-left transition-all border-2',
                  muscleFocus === option.id
                    ? 'border-current'
                    : 'border-text-muted/20 hover:border-text-muted/40'
                )}
                style={
                  muscleFocus === option.id
                    ? { borderColor: option.color, backgroundColor: `${option.color}15` }
                    : undefined
                }
              >
                <div
                  className="w-3 h-3 mb-2"
                  style={{ backgroundColor: option.color }}
                />
                <span
                  className={cn(
                    'font-display text-sm uppercase tracking-wider',
                    muscleFocus === option.id ? 'font-bold' : 'text-text-secondary'
                  )}
                  style={muscleFocus === option.id ? { color: option.color } : undefined}
                >
                  {option.nameHu}
                </span>
              </button>
            ))}
          </div>
          <p className="text-2xs text-text-muted mt-3">
            Ez határozza meg az edzés színét és kategóriáját
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Step 2: Day Assignment
function StepDays({
  assignedDays,
  toggleDay,
}: {
  assignedDays: number[]
  toggleDay: (day: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="space-y-6">
        <div>
          <label className="label mb-2 block">Mikor jelenjek meg?</label>
          <p className="text-text-secondary text-sm mb-6">
            Válaszd ki, mely napokon szeretnéd látni ezt az edzést a főoldalon.
            Ha nem választasz napot, mindig elérhető lesz.
          </p>

          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center font-display text-sm uppercase transition-all border-2',
                  assignedDays.includes(day)
                    ? 'bg-accent text-bg-primary font-bold border-accent'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary border-transparent hover:border-text-muted/30'
                )}
              >
                {DAY_ABBREV_HU[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-2">
            Előnézet
          </p>
          {assignedDays.length === 0 ? (
            <p className="text-text-secondary">
              Ez az edzés <span className="text-accent font-semibold">minden nap</span> elérhető lesz
            </p>
          ) : (
            <p className="text-text-secondary">
              Ez az edzés a következő napokon jelenik meg:{' '}
              <span className="text-accent font-semibold">
                {assignedDays.map((d) => DAY_ABBREV_HU[d as DayOfWeek]).join(', ')}
              </span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Step 3: Exercise Selection
function StepExercises({
  exercises,
  setExercises,
  focusColor,
  onAdd,
  onUpdate,
  onRemove,
}: {
  exercises: TemplateExercise[]
  setExercises: React.Dispatch<React.SetStateAction<TemplateExercise[]>>
  focusColor: string
  onAdd: (config: Omit<TemplateExercise, 'order'>) => void
  onUpdate: (index: number, config: Omit<TemplateExercise, 'order'>) => void
  onRemove: (index: number) => void
}) {
  const [mode, setMode] = useState<'list' | 'picker' | 'config'>('list')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setMode('config')
  }

  const handleSaveConfig = (config: Omit<TemplateExercise, 'order'>) => {
    if (editingIndex !== null) {
      onUpdate(editingIndex, config)
    } else {
      onAdd(config)
    }
    setMode('list')
    setSelectedExercise(null)
    setEditingIndex(null)
  }

  const handleEditExercise = (index: number) => {
    const ex = exercises[index]
    const exerciseData = getExerciseById(ex.exerciseId)
    if (exerciseData) {
      setSelectedExercise(exerciseData)
      setEditingIndex(index)
      setMode('config')
    }
  }

  const handleBack = () => {
    if (mode === 'config') {
      setMode('picker')
    } else {
      setMode('list')
      setSelectedExercise(null)
      setEditingIndex(null)
    }
  }

  // List view
  if (mode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full flex flex-col"
      >
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {exercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-2 border-dashed border-text-muted/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="square" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-text-muted mb-2">Még nincs gyakorlat</p>
              <p className="text-2xs text-text-muted">
                Adj hozzá gyakorlatokat az edzésedhez
              </p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={exercises}
              onReorder={setExercises}
              className="space-y-2"
            >
              {exercises.map((ex, index) => (
                <ExerciseListItem
                  key={ex.exerciseId + '-' + index}
                  exercise={ex}
                  index={index}
                  focusColor={focusColor}
                  onEdit={() => handleEditExercise(index)}
                  onRemove={() => onRemove(index)}
                />
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Add button */}
        <div className="px-4 pb-4 flex-shrink-0">
          <button
            onClick={() => setMode('picker')}
            className="w-full p-4 border-2 border-dashed border-accent/50 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-display uppercase tracking-wider">Gyakorlat hozzáadása</span>
          </button>
        </div>
      </motion.div>
    )
  }

  // Exercise picker view
  if (mode === 'picker') {
    return (
      <ExercisePickerView
        excludeIds={exercises.map((e) => e.exerciseId)}
        onSelect={handleSelectExercise}
        onBack={() => setMode('list')}
      />
    )
  }

  // Exercise config view
  if (mode === 'config' && selectedExercise) {
    return (
      <ExerciseConfigView
        exercise={selectedExercise}
        initialConfig={editingIndex !== null ? exercises[editingIndex] : undefined}
        onSave={handleSaveConfig}
        onBack={handleBack}
        isEditing={editingIndex !== null}
      />
    )
  }

  return null
}

// Exercise list item (draggable)
function ExerciseListItem({
  exercise,
  index,
  focusColor,
  onEdit,
  onRemove,
}: {
  exercise: TemplateExercise
  index: number
  focusColor: string
  onEdit: () => void
  onRemove: () => void
}) {
  const exerciseData = getExerciseById(exercise.exerciseId)
  const muscle = exerciseData
    ? muscleGroups.find((m) => m.id === exerciseData.muscleGroupPrimary)
    : null

  return (
    <Reorder.Item
      value={exercise}
      className="bg-bg-secondary border border-text-muted/20"
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <div className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary p-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
          </svg>
        </div>

        {/* Index */}
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
          style={{ backgroundColor: `${muscle?.color || focusColor}20`, color: muscle?.color || focusColor }}
        >
          {index + 1}
        </div>

        {/* Exercise info */}
        <div className="flex-1 min-w-0" onClick={onEdit}>
          <p className="font-display text-sm font-semibold text-text-primary truncate">
            {exerciseData?.nameHu || exercise.exerciseId}
          </p>
          <p className="text-2xs text-text-muted">
            {exercise.targetSets} × {exercise.targetRepMin}-{exercise.targetRepMax} ism. · {Math.floor(exercise.restSeconds / 60)}:{(exercise.restSeconds % 60).toString().padStart(2, '0')} pihenő
          </p>
        </div>

        {/* Actions */}
        <button onClick={onEdit} className="p-2 text-text-muted hover:text-accent transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onRemove} className="p-2 text-text-muted hover:text-danger transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  )
}

// Full-screen exercise picker
function ExercisePickerView({
  excludeIds,
  onSelect,
  onBack,
}: {
  excludeIds: string[]
  onSelect: (exercise: Exercise) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all')

  const filteredExercises = useMemo(() => {
    return allExercises.filter((exercise) => {
      if (excludeIds.includes(exercise.id)) return false
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
  }, [search, selectedMuscle, excludeIds])

  const mainMuscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col bg-bg-primary"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-text-muted/10 flex-shrink-0">
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
                      <span className="text-2xs text-text-muted">
                        {exercise.type === 'compound' ? 'Összetett' : 'Izolált'}
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

      {/* Count */}
      <div className="px-4 py-2 border-t border-text-muted/10 flex-shrink-0">
        <p className="text-2xs text-text-muted text-center">
          {filteredExercises.length} gyakorlat
          {excludeIds.length > 0 && <span> · {excludeIds.length} már hozzáadva</span>}
        </p>
      </div>
    </motion.div>
  )
}

// Full-screen exercise config
function ExerciseConfigView({
  exercise,
  initialConfig,
  onSave,
  onBack,
  isEditing,
}: {
  exercise: Exercise
  initialConfig?: TemplateExercise
  onSave: (config: Omit<TemplateExercise, 'order'>) => void
  onBack: () => void
  isEditing: boolean
}) {
  const [sets, setSets] = useState(initialConfig?.targetSets ?? 3)
  const [repMin, setRepMin] = useState(initialConfig?.targetRepMin ?? exercise.defaultRepRangeMin)
  const [repMax, setRepMax] = useState(initialConfig?.targetRepMax ?? exercise.defaultRepRangeMax)
  const [restSeconds, setRestSeconds] = useState(
    initialConfig?.restSeconds ?? (exercise.type === 'compound' ? 180 : 90)
  )

  const muscle = muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)

  const handleSave = () => {
    onSave({
      exerciseId: exercise.id,
      targetSets: sets,
      targetRepMin: repMin,
      targetRepMax: repMax,
      restSeconds,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col bg-bg-primary"
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

      {/* Summary & Save */}
      <div className="px-4 py-4 border-t-2 border-text-muted/20 flex-shrink-0 bg-bg-primary">
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
        <Button variant="primary" className="w-full" onClick={handleSave}>
          {isEditing ? 'Mentés' : 'Hozzáadás'}
        </Button>
      </div>
    </motion.div>
  )
}

// Step 4: Review
function StepReview({
  name,
  muscleFocus,
  exercises,
  setExercises,
  assignedDays,
  focusColor,
  onRemove,
}: {
  name: string
  muscleFocus: WorkoutType
  exercises: TemplateExercise[]
  setExercises: React.Dispatch<React.SetStateAction<TemplateExercise[]>>
  assignedDays: number[]
  focusColor: string
  onRemove: (index: number) => void
}) {
  const totalSets = exercises.reduce((sum, ex) => sum + ex.targetSets, 0)
  const estimatedDuration = Math.round(totalSets * 3)
  const muscleOption = MUSCLE_FOCUS_OPTIONS.find((m) => m.id === muscleFocus)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto px-4 py-6"
    >
      {/* Summary card */}
      <div className="bg-bg-secondary border-2 border-text-muted/20 p-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-1.5 self-stretch" style={{ backgroundColor: focusColor }} />
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary">
              {name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm" style={{ color: focusColor }}>
                {muscleOption?.nameHu}
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-sm text-text-muted font-mono">
                {exercises.length} gyakorlat
              </span>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-text-muted/10">
              <div>
                <p className="text-2xs text-text-muted uppercase tracking-wider">Sorozat</p>
                <p className="font-mono text-lg font-bold text-text-primary">~{totalSets}</p>
              </div>
              <div>
                <p className="text-2xs text-text-muted uppercase tracking-wider">Időtartam</p>
                <p className="font-mono text-lg font-bold text-text-primary">~{estimatedDuration} perc</p>
              </div>
              <div>
                <p className="text-2xs text-text-muted uppercase tracking-wider">Napok</p>
                <p className="font-mono text-lg font-bold text-text-primary">
                  {assignedDays.length === 0
                    ? 'Mind'
                    : assignedDays.map((d) => DAY_ABBREV_HU[d as DayOfWeek]).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="mb-4">
        <label className="label mb-3 block">Gyakorlatok sorrendje</label>
        <p className="text-2xs text-text-muted mb-3">
          Húzd a gyakorlatokat a sorrend módosításához
        </p>
        <Reorder.Group
          axis="y"
          values={exercises}
          onReorder={setExercises}
          className="space-y-2"
        >
          {exercises.map((ex, index) => {
            const exerciseData = getExerciseById(ex.exerciseId)
            const muscle = exerciseData
              ? muscleGroups.find((m) => m.id === exerciseData.muscleGroupPrimary)
              : null

            return (
              <Reorder.Item
                key={ex.exerciseId + '-' + index}
                value={ex}
                className="bg-bg-secondary border border-text-muted/20"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary p-1">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
                    style={{ backgroundColor: `${muscle?.color || focusColor}20`, color: muscle?.color || focusColor }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-semibold text-text-primary truncate">
                      {exerciseData?.nameHu || ex.exerciseId}
                    </p>
                    <p className="text-2xs text-text-muted">
                      {ex.targetSets} × {ex.targetRepMin}-{ex.targetRepMax} ism.
                    </p>
                  </div>
                  <button onClick={() => onRemove(index)} className="p-2 text-text-muted hover:text-danger transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      </div>
    </motion.div>
  )
}
