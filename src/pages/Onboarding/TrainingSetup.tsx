import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { WorkoutType, TrainingDays } from '@/types'

const DAYS = [
  { key: 'monday', label: 'Hétfő' },
  { key: 'tuesday', label: 'Kedd' },
  { key: 'wednesday', label: 'Szerda' },
  { key: 'thursday', label: 'Csütörtök' },
  { key: 'friday', label: 'Péntek' },
  { key: 'saturday', label: 'Szombat' },
  { key: 'sunday', label: 'Vasárnap' },
] as const

const WORKOUT_TYPES: { value: WorkoutType; label: string; color: string }[] = [
  { value: 'chest', label: 'Mell', color: 'bg-muscle-chest' },
  { value: 'back', label: 'Hát', color: 'bg-muscle-back' },
  { value: 'shoulders', label: 'Váll', color: 'bg-muscle-shoulders' },
  { value: 'arms', label: 'Kar', color: 'bg-muscle-arms' },
  { value: 'legs', label: 'Láb', color: 'bg-muscle-legs' },
  { value: 'flex', label: 'Rugalmas', color: 'bg-text-muted' },
  { value: 'rest', label: 'Pihenő', color: 'bg-bg-elevated' },
]

export function TrainingSetupPage() {
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState<keyof TrainingDays>('monday')
  const [schedule, setSchedule] = useState<TrainingDays>({
    monday: 'chest',
    tuesday: 'back',
    wednesday: 'shoulders',
    thursday: 'arms',
    friday: 'legs',
    saturday: 'flex',
    sunday: 'rest',
  })

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
    return WORKOUT_TYPES.find((w) => w.value === type)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        <header className="pt-8 space-y-2">
          <p className="text-accent text-sm font-medium">2 / 3</p>
          <h1 className="font-display text-3xl font-bold">Edzés beállítások</h1>
          <p className="text-text-secondary">
            Válaszd ki, melyik napon mit szeretnél edzeni.
          </p>
        </header>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {DAYS.map((day) => {
            const workout = getWorkoutInfo(schedule[day.key])
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-lg transition-all text-sm',
                  selectedDay === day.key
                    ? 'bg-accent text-bg-primary'
                    : 'bg-bg-secondary text-text-secondary'
                )}
              >
                <div className="font-medium">{day.label.slice(0, 2)}</div>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mx-auto mt-1',
                    workout?.color || 'bg-bg-elevated'
                  )}
                />
              </button>
            )
          })}
        </div>

        {/* Workout type selector */}
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            {DAYS.find((d) => d.key === selectedDay)?.label} edzése:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPES.map((type) => (
              <Card
                key={type.value}
                className={cn(
                  'cursor-pointer py-3 transition-all flex items-center gap-3',
                  schedule[selectedDay] === type.value && 'border-accent bg-accent/10'
                )}
                onClick={() => handleWorkoutSelect(type.value)}
              >
                <div className={cn('w-3 h-3 rounded-full', type.color)} />
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
        <Card className="space-y-2">
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
                  <div className={cn('w-2 h-2 rounded-full', workout?.color)} />
                  <span>{workout?.label}</span>
                </div>
              </div>
            )
          })}
        </Card>

        <div className="pt-4 space-y-3">
          <Button size="lg" className="w-full" onClick={handleNext}>
            Tovább
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding/personal')}
          >
            Vissza
          </Button>
        </div>
      </div>
    </div>
  )
}
