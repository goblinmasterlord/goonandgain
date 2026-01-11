import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { WorkoutType, TrainingDays, SplitType } from '@/types'

const DAYS = [
  { key: 'monday', label: 'Hétfő' },
  { key: 'tuesday', label: 'Kedd' },
  { key: 'wednesday', label: 'Szerda' },
  { key: 'thursday', label: 'Csütörtök' },
  { key: 'friday', label: 'Péntek' },
  { key: 'saturday', label: 'Szombat' },
  { key: 'sunday', label: 'Vasárnap' },
] as const

// Workout types for Bro Split
const BRO_SPLIT_TYPES: { value: WorkoutType; label: string; color: string }[] = [
  { value: 'chest', label: 'Mell', color: 'bg-muscle-chest' },
  { value: 'back', label: 'Hát', color: 'bg-muscle-back' },
  { value: 'shoulders', label: 'Váll', color: 'bg-muscle-shoulders' },
  { value: 'arms', label: 'Kar', color: 'bg-muscle-arms' },
  { value: 'legs', label: 'Láb', color: 'bg-muscle-legs' },
  { value: 'flex', label: 'Rugalmas', color: 'bg-text-muted' },
  { value: 'rest', label: 'Pihenő', color: 'bg-bg-elevated' },
]

// Workout types for PPL
const PPL_TYPES: { value: WorkoutType; label: string; color: string }[] = [
  { value: 'push', label: 'Push', color: 'bg-muscle-push' },
  { value: 'pull', label: 'Pull', color: 'bg-muscle-pull' },
  { value: 'legs', label: 'Láb', color: 'bg-muscle-legs' },
  { value: 'rest', label: 'Pihenő', color: 'bg-bg-elevated' },
]

// Default schedules
const BRO_SPLIT_DEFAULT: TrainingDays = {
  monday: 'chest',
  tuesday: 'back',
  wednesday: 'shoulders',
  thursday: 'arms',
  friday: 'legs',
  saturday: 'flex',
  sunday: 'rest',
}

const PPL_DEFAULT: TrainingDays = {
  monday: 'push',
  tuesday: 'pull',
  wednesday: 'legs',
  thursday: 'push',
  friday: 'pull',
  saturday: 'legs',
  sunday: 'rest',
}

export function TrainingSetupPage() {
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState<keyof TrainingDays>('monday')
  const [splitType, setSplitType] = useState<SplitType>('bro-split')
  const [schedule, setSchedule] = useState<TrainingDays>(BRO_SPLIT_DEFAULT)

  // Load splitType from localStorage on mount
  useEffect(() => {
    const onboardingData = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    const selectedSplit: SplitType = onboardingData.splitType || 'bro-split'
    setSplitType(selectedSplit)
    setSchedule(selectedSplit === 'ppl' ? PPL_DEFAULT : BRO_SPLIT_DEFAULT)
  }, [])

  const workoutTypes = splitType === 'ppl' ? PPL_TYPES : BRO_SPLIT_TYPES

  const handleWorkoutSelect = (type: WorkoutType) => {
    setSchedule((prev) => ({ ...prev, [selectedDay]: type }))
  }

  const handleNext = () => {
    const existingData = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    localStorage.setItem('onboarding_data', JSON.stringify({
      ...existingData,
      trainingDays: schedule,
    }))
    navigate('/onboarding/ready')
  }

  const getWorkoutInfo = (type: WorkoutType | undefined) => {
    return workoutTypes.find((w) => w.value === type) ||
           BRO_SPLIT_TYPES.find((w) => w.value === type) ||
           PPL_TYPES.find((w) => w.value === type)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Progress bar */}
      <div className="h-1 bg-bg-elevated">
        <div className="h-full w-[80%] bg-accent" />
      </div>

      <div className="px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm text-accent">04</span>
            <div className="flex-1 h-px bg-text-muted/20" />
            <span className="font-mono text-sm text-text-muted">05</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
            Heti beosztás
          </h1>
          <p className="text-text-secondary text-sm">
            Válaszd ki, melyik napon mit szeretnél edzeni.
          </p>
        </header>

        {/* Current split indicator */}
        <div className="mb-6 p-3 bg-bg-secondary border border-text-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-display uppercase tracking-wider text-text-muted">
              Kiválasztott program
            </span>
            <span className="font-display text-sm font-bold text-accent uppercase">
              {splitType === 'ppl' ? 'Push/Pull/Legs' : 'Bro Split'}
            </span>
          </div>
        </div>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 mb-6">
          {DAYS.map((day) => {
            const workout = getWorkoutInfo(schedule[day.key])
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                className={cn(
                  'flex-shrink-0 px-3 py-2 transition-all text-sm',
                  selectedDay === day.key
                    ? 'bg-accent text-bg-primary'
                    : 'bg-bg-secondary text-text-secondary'
                )}
              >
                <div className="font-medium">{day.label.slice(0, 2)}</div>
                <div
                  className={cn(
                    'w-2 h-2 mx-auto mt-1',
                    workout?.color || 'bg-bg-elevated'
                  )}
                />
              </button>
            )
          })}
        </div>

        {/* Workout type selector */}
        <div className="space-y-2 mb-6">
          <p className="text-sm text-text-secondary">
            {DAYS.find((d) => d.key === selectedDay)?.label} edzése:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {workoutTypes.map((type) => (
              <Card
                key={type.value}
                className={cn(
                  'cursor-pointer py-3 transition-all flex items-center gap-3',
                  schedule[selectedDay] === type.value && 'border-accent bg-accent/10'
                )}
                onClick={() => handleWorkoutSelect(type.value)}
              >
                <div className={cn('w-3 h-3', type.color)} />
                <span
                  className={
                    schedule[selectedDay] === type.value
                      ? 'text-accent'
                      : 'text-text-primary'
                  }
                >
                  {type.label}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Schedule preview */}
        <Card className="space-y-2 mb-8">
          <p className="text-sm text-text-secondary mb-3">Heti beosztás:</p>
          {DAYS.map((day) => {
            const workout = getWorkoutInfo(schedule[day.key])
            return (
              <div
                key={day.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-secondary">{day.label}</span>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2', workout?.color)} />
                  <span>{workout?.label}</span>
                </div>
              </div>
            )
          })}
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Button size="lg" className="w-full" onClick={handleNext}>
            TOVÁBB
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding/program')}
          >
            VISSZA
          </Button>
        </div>
      </div>
    </div>
  )
}
