import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { muscleGroups } from '@/data'
import { cn } from '@/lib/utils/cn'
import type { Exercise, TemplateExercise } from '@/types'

interface ExerciseConfigModalProps {
  isOpen: boolean
  exercise: Exercise | null
  onClose: () => void
  onSave: (config: Omit<TemplateExercise, 'order'>) => void
  initialConfig?: Partial<TemplateExercise> // For editing existing exercises
}

const REST_OPTIONS = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2min' },
  { value: 180, label: '3min' },
  { value: 240, label: '4min' },
]

export function ExerciseConfigModal({
  isOpen,
  exercise,
  onClose,
  onSave,
  initialConfig,
}: ExerciseConfigModalProps) {
  const [sets, setSets] = useState(initialConfig?.targetSets ?? 3)
  const [repMin, setRepMin] = useState(
    initialConfig?.targetRepMin ?? exercise?.defaultRepRangeMin ?? 8
  )
  const [repMax, setRepMax] = useState(
    initialConfig?.targetRepMax ?? exercise?.defaultRepRangeMax ?? 12
  )
  const [restSeconds, setRestSeconds] = useState(
    initialConfig?.restSeconds ?? (exercise?.type === 'compound' ? 180 : 90)
  )

  if (!isOpen || !exercise) return null

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg-primary/95 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-bg-secondary border-2 border-text-muted/30 w-full max-w-md"
        >
          {/* Header */}
          <div className="p-4 border-b border-text-muted/20">
            <div className="flex items-center gap-3">
              <div
                className="w-1.5 h-10"
                style={{ backgroundColor: muscle?.color }}
              />
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

          {/* Configuration */}
          <div className="p-4 space-y-6">
            {/* Sets */}
            <div>
              <label className="label mb-3 block">Sorozatok</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSets(Math.max(1, sets - 1))}
                  className="w-12 h-12 bg-bg-elevated border border-text-muted/30 text-text-primary hover:border-accent transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="square" d="M20 12H4" />
                  </svg>
                </button>
                <span className="font-mono text-4xl font-bold text-accent w-16 text-center">
                  {sets}
                </span>
                <button
                  onClick={() => setSets(Math.min(10, sets + 1))}
                  className="w-12 h-12 bg-bg-elevated border border-text-muted/30 text-text-primary hover:border-accent transition-colors flex items-center justify-center"
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
                </button>
              </div>
            </div>

            {/* Rep range */}
            <div>
              <label className="label mb-3 block">Ismétlés tartomány</label>
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-2xs text-text-muted mb-1">Min</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRepMin(Math.max(1, repMin - 1))}
                      className="w-8 h-8 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono text-2xl font-bold text-text-primary w-10 text-center">
                      {repMin}
                    </span>
                    <button
                      onClick={() => setRepMin(Math.min(repMax - 1, repMin + 1))}
                      className="w-8 h-8 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-text-muted text-2xl mt-5">—</span>

                <div className="flex flex-col items-center">
                  <span className="text-2xs text-text-muted mb-1">Max</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRepMax(Math.max(repMin + 1, repMax - 1))}
                      className="w-8 h-8 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono text-2xl font-bold text-text-primary w-10 text-center">
                      {repMax}
                    </span>
                    <button
                      onClick={() => setRepMax(Math.min(30, repMax + 1))}
                      className="w-8 h-8 bg-bg-elevated border border-text-muted/30 text-text-muted hover:border-accent hover:text-text-primary transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest time */}
            <div>
              <label className="label mb-3 block">Pihenő</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {REST_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRestSeconds(option.value)}
                    className={cn(
                      'px-4 py-2 font-mono text-sm transition-all',
                      restSeconds === option.value
                        ? 'bg-accent text-bg-primary font-bold'
                        : 'bg-bg-elevated text-text-muted hover:text-text-primary border border-text-muted/30'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary preview */}
          <div className="px-4 py-3 bg-bg-elevated/50 border-t border-text-muted/10">
            <p className="text-center text-text-secondary">
              <span className="font-mono font-bold text-accent">{sets}</span>
              <span className="text-text-muted"> × </span>
              <span className="font-mono font-bold">{repMin}-{repMax}</span>
              <span className="text-text-muted"> ism. · </span>
              <span className="font-mono">{restSeconds >= 60 ? `${Math.floor(restSeconds / 60)}:${(restSeconds % 60).toString().padStart(2, '0')}` : `${restSeconds}s`}</span>
              <span className="text-text-muted"> pihenő</span>
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-text-muted/20 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Mégse
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              {initialConfig ? 'Mentés' : 'Hozzáadás'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
