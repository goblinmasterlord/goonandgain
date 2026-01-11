import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { allExercises, muscleGroups, equipmentTypes } from '@/data'
import { cn } from '@/lib/utils/cn'
import type { Exercise, MuscleGroup } from '@/types'

interface ExercisePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  excludeExerciseIds?: string[] // Exercises already in the workout
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  excludeExerciseIds = [],
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all')

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter((exercise) => {
      // Exclude already added exercises
      if (excludeExerciseIds.includes(exercise.id)) return false

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName =
          exercise.nameHu.toLowerCase().includes(searchLower) ||
          exercise.nameEn.toLowerCase().includes(searchLower)
        if (!matchesName) return false
      }

      // Filter by muscle group
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
  }, [search, selectedMuscle, excludeExerciseIds])

  // Main muscle groups to show as filter chips
  const mainMuscleGroups: MuscleGroup[] = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'quads',
    'hamstrings',
    'glutes',
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg-primary/98 z-50 flex flex-col"
      >
        {/* Header */}
        <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide">
              Gyakorlat kiválasztása
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-accent transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="px-4 py-3 border-b border-text-muted/10 flex-shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
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

        {/* Muscle filter chips */}
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
                  style={
                    selectedMuscle === muscleId
                      ? { backgroundColor: muscle.color }
                      : undefined
                  }
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
                const muscle = muscleGroups.find(
                  (m) => m.id === exercise.muscleGroupPrimary
                )
                const equipment = equipmentTypes.find(
                  (e) => e.id === exercise.equipment
                )

                return (
                  <button
                    key={exercise.id}
                    onClick={() => onSelect(exercise)}
                    className="w-full text-left p-4 bg-bg-secondary border border-text-muted/20 hover:border-accent/50 transition-all flex items-center gap-4"
                  >
                    {/* Color bar */}
                    <div
                      className="w-1 h-12 flex-shrink-0"
                      style={{ backgroundColor: muscle?.color }}
                    />

                    {/* Exercise info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-text-primary uppercase tracking-wide truncate">
                        {exercise.nameHu}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-2xs uppercase tracking-wider"
                          style={{ color: muscle?.color }}
                        >
                          {muscle?.nameHu}
                        </span>
                        <span className="text-text-muted">·</span>
                        <span className="text-2xs text-text-muted">
                          {exercise.type === 'compound' ? 'Összetett' : 'Izolált'}
                        </span>
                        <span className="text-text-muted">·</span>
                        <span className="text-2xs text-text-muted">
                          {equipment?.nameHu}
                        </span>
                      </div>
                    </div>

                    {/* Add icon */}
                    <div className="w-10 h-10 bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="square" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="px-4 py-2 border-t border-text-muted/10 flex-shrink-0">
          <p className="text-2xs text-text-muted text-center">
            {filteredExercises.length} gyakorlat
            {excludeExerciseIds.length > 0 && (
              <span> · {excludeExerciseIds.length} már hozzáadva</span>
            )}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
