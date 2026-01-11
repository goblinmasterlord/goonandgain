import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Reorder } from 'framer-motion'
import {
  createCustomTemplate,
  updateCustomTemplate,
  getCustomTemplateById,
} from '@/lib/db'
import { queueSync, isSupabaseConfigured } from '@/lib/sync'
import { getExerciseById, muscleGroups } from '@/data'
import { ExercisePickerModal, ExerciseConfigModal } from '@/components/workout'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { TemplateExercise, WorkoutType, Exercise, DayOfWeek } from '@/types'
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

export function CustomWorkoutBuilderPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = id && id !== 'new'

  const [name, setName] = useState('')
  const [muscleFocus, setMuscleFocus] = useState<WorkoutType>('chest')
  const [exercises, setExercises] = useState<TemplateExercise[]>([])
  const [assignedDays, setAssignedDays] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)

  // Modal states
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [exerciseToConfig, setExerciseToConfig] = useState<Exercise | null>(null)
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)

  // Load existing template if editing
  useEffect(() => {
    if (isEditing) {
      loadTemplate()
    }
  }, [id])

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

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Kérlek adj nevet az edzésnek!')
      return
    }
    if (exercises.length === 0) {
      alert('Kérlek adj hozzá legalább egy gyakorlatot!')
      return
    }

    setIsSaving(true)
    try {
      // Reorder exercises to ensure order is correct
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
        // Queue sync for update
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
        // Queue sync for insert
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

  const handleExerciseSelect = (exercise: Exercise) => {
    setShowExercisePicker(false)
    setExerciseToConfig(exercise)
    setEditingExerciseIndex(null)
  }

  const handleExerciseConfig = (config: Omit<TemplateExercise, 'order'>) => {
    if (editingExerciseIndex !== null) {
      // Editing existing exercise
      setExercises((prev) =>
        prev.map((ex, i) =>
          i === editingExerciseIndex ? { ...config, order: ex.order } : ex
        )
      )
    } else {
      // Adding new exercise
      setExercises((prev) => [
        ...prev,
        { ...config, order: prev.length + 1 },
      ])
    }
    setExerciseToConfig(null)
    setEditingExerciseIndex(null)
  }

  const handleEditExercise = (index: number) => {
    const exercise = getExerciseById(exercises[index].exerciseId)
    if (exercise) {
      setExerciseToConfig(exercise)
      setEditingExerciseIndex(index)
    }
  }

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleDay = (day: number) => {
    setAssignedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const focusColor = MUSCLE_FOCUS_OPTIONS.find((m) => m.id === muscleFocus)?.color || '#8a8a8a'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-32">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20">
        <button
          onClick={() => navigate('/settings/custom-workouts')}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-3"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-display uppercase tracking-wider">Vissza</span>
        </button>
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">
          {isEditing ? 'Edzés szerkesztése' : 'Új edzés'}
        </h1>
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* Name input */}
        <div>
          <label className="label mb-2 block">Edzés neve</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pl. Push nap, Felső test..."
            className="input w-full"
          />
        </div>

        {/* Muscle focus */}
        <div>
          <label className="label mb-2 block">Izomcsoport fókusz</label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_FOCUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setMuscleFocus(option.id)}
                className={cn(
                  'px-3 py-2 text-sm font-display uppercase tracking-wider transition-all',
                  muscleFocus === option.id
                    ? 'text-bg-primary font-bold'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                )}
                style={
                  muscleFocus === option.id
                    ? { backgroundColor: option.color }
                    : undefined
                }
              >
                {option.nameHu}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned days (optional) */}
        <div>
          <label className="label mb-2 block">
            Napok <span className="text-text-muted font-normal">(opcionális)</span>
          </label>
          <div className="flex gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={cn(
                  'w-10 h-10 font-display text-sm uppercase transition-all',
                  assignedDays.includes(day)
                    ? 'bg-accent text-bg-primary font-bold'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                )}
              >
                {DAY_ABBREV_HU[day]}
              </button>
            ))}
          </div>
          <p className="text-2xs text-text-muted mt-2">
            Ha nem választasz napot, az edzés bármikor elérhető lesz.
          </p>
        </div>

        {/* Exercises section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label">
              Gyakorlatok <span className="text-text-muted font-normal">({exercises.length})</span>
            </label>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-text-muted/30 bg-bg-secondary/50">
              <p className="text-text-muted mb-2">Még nincs gyakorlat</p>
              <p className="text-2xs text-text-muted">
                Kattints a lenti gombra a hozzáadáshoz
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
                <ExerciseRow
                  key={ex.exerciseId + '-' + index}
                  exercise={ex}
                  index={index}
                  focusColor={focusColor}
                  onEdit={() => handleEditExercise(index)}
                  onRemove={() => handleRemoveExercise(index)}
                />
              ))}
            </Reorder.Group>
          )}

          {/* Add exercise button */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full mt-3 p-4 border-2 border-dashed border-text-muted/30 hover:border-accent/50 text-text-muted hover:text-accent transition-all flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="square" d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-display uppercase tracking-wider">Gyakorlat hozzáadása</span>
          </button>
        </div>
      </div>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-primary border-t-2 border-text-muted/20 pb-24">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving || !name.trim() || exercises.length === 0}
        >
          {isSaving ? 'Mentés...' : isEditing ? 'MÓDOSÍTÁSOK MENTÉSE' : 'EDZÉS MENTÉSE'}
        </Button>
      </div>

      {/* Exercise picker modal */}
      <ExercisePickerModal
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={handleExerciseSelect}
        excludeExerciseIds={exercises.map((e) => e.exerciseId)}
      />

      {/* Exercise config modal */}
      <ExerciseConfigModal
        isOpen={!!exerciseToConfig}
        exercise={exerciseToConfig}
        onClose={() => {
          setExerciseToConfig(null)
          setEditingExerciseIndex(null)
        }}
        onSave={handleExerciseConfig}
        initialConfig={
          editingExerciseIndex !== null ? exercises[editingExerciseIndex] : undefined
        }
      />
    </div>
  )
}

interface ExerciseRowProps {
  exercise: TemplateExercise
  index: number
  focusColor: string
  onEdit: () => void
  onRemove: () => void
}

function ExerciseRow({ exercise, index, focusColor, onEdit, onRemove }: ExerciseRowProps) {
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
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-semibold text-text-primary truncate">
            {exerciseData?.nameHu || exercise.exerciseId}
          </p>
          <p className="text-2xs text-text-muted">
            {exercise.targetSets} × {exercise.targetRepMin}-{exercise.targetRepMax} ism. · {Math.floor(exercise.restSeconds / 60)}:{(exercise.restSeconds % 60).toString().padStart(2, '0')} pihenő
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={onEdit}
          className="p-2 text-text-muted hover:text-accent transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="square"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="p-2 text-text-muted hover:text-danger transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Reorder.Item>
  )
}
