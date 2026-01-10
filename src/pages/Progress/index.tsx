import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { getSetsInDateRange, getWeekStart } from '@/lib/db'
import { getExerciseById, muscleGroups } from '@/data'
import { StrengthBenchmarks } from '@/components/dashboard'
import { cn } from '@/lib/utils/cn'
import type { SetLog } from '@/types'

// Volume guidelines from PRD
const VOLUME_GUIDELINES: Record<string, { min: number; optimal: number; max: number }> = {
  chest: { min: 10, optimal: 16, max: 20 },
  back: { min: 10, optimal: 18, max: 22 },
  shoulders: { min: 8, optimal: 16, max: 20 },
  biceps: { min: 6, optimal: 14, max: 18 },
  triceps: { min: 6, optimal: 14, max: 18 },
  quads: { min: 8, optimal: 16, max: 20 },
  hamstrings: { min: 6, optimal: 14, max: 18 },
  glutes: { min: 6, optimal: 12, max: 16 },
  calves: { min: 6, optimal: 12, max: 16 },
}

interface MuscleVolume {
  id: string
  nameHu: string
  color: string
  sets: number
  avgRir: number
  status: 'low' | 'optimal' | 'high'
}

export function ProgressPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [sets, setSets] = useState<SetLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const currentWeekStart = useMemo(() => {
    const start = getWeekStart()
    start.setDate(start.getDate() + weekOffset * 7)
    return start
  }, [weekOffset])

  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart)
    end.setDate(end.getDate() + 7)
    return end
  }, [currentWeekStart])

  useEffect(() => {
    loadWeekData()
  }, [currentWeekStart])

  const loadWeekData = async () => {
    setIsLoading(true)
    try {
      const weekSets = await getSetsInDateRange(currentWeekStart, currentWeekEnd)
      setSets(weekSets)
    } catch (error) {
      console.error('Failed to load week data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate volume by muscle group
  const volumeByMuscle = useMemo(() => {
    const volumeMap: Record<string, { sets: number; totalRir: number }> = {}

    // Initialize all muscle groups
    muscleGroups.forEach((m) => {
      volumeMap[m.id] = { sets: 0, totalRir: 0 }
    })

    // Count sets per primary muscle group
    sets.forEach((set) => {
      const exercise = getExerciseById(set.exerciseId)
      if (exercise) {
        const muscleId = exercise.muscleGroupPrimary
        if (volumeMap[muscleId]) {
          volumeMap[muscleId].sets += 1
          volumeMap[muscleId].totalRir += set.rir
        }
      }
    })

    // Convert to array with status
    const result: MuscleVolume[] = muscleGroups
      .filter((m) => VOLUME_GUIDELINES[m.id]) // Only show tracked muscles
      .map((muscle) => {
        const data = volumeMap[muscle.id]
        const guidelines = VOLUME_GUIDELINES[muscle.id]
        const avgRir = data.sets > 0 ? data.totalRir / data.sets : 0

        let status: 'low' | 'optimal' | 'high' = 'optimal'
        if (data.sets < guidelines.min) status = 'low'
        else if (data.sets > guidelines.max) status = 'high'

        return {
          id: muscle.id,
          nameHu: muscle.nameHu,
          color: muscle.color,
          sets: data.sets,
          avgRir: Math.round(avgRir * 10) / 10,
          status,
        }
      })
      .sort((a, b) => b.sets - a.sets) // Sort by sets descending

    return result
  }, [sets])

  // Calculate totals
  const totalSets = sets.length
  const avgRir = sets.length > 0 ? sets.reduce((sum, s) => sum + s.rir, 0) / sets.length : 0

  const isCurrentWeek = weekOffset === 0

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20">
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">Haladás</h1>
        <p className="text-text-muted text-xs mt-0.5">Heti volumen és statisztikák</p>
      </header>

      {/* Week Selector */}
      <div className="px-5 py-4 border-b border-text-muted/10 bg-bg-secondary/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 text-text-muted hover:text-accent transition-colors"
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
          </button>

          <div className="text-center">
            <p className="font-display font-bold text-text-primary uppercase tracking-wide">
              {isCurrentWeek ? 'Ez a hét' : format(currentWeekStart, 'MMM d.', { locale: hu })}
            </p>
            <p className="text-2xs text-text-muted">
              {format(currentWeekStart, 'yyyy. MMMM d.', { locale: hu })} -{' '}
              {format(currentWeekEnd, 'MMMM d.', { locale: hu })}
            </p>
          </div>

          <button
            onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
            disabled={isCurrentWeek}
            className={cn(
              'p-2 transition-colors',
              isCurrentWeek ? 'text-text-muted/30' : 'text-text-muted hover:text-accent'
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="square" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="px-5 py-4 border-b border-text-muted/10">
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-block">
            <p className="font-mono text-4xl font-bold text-accent">{totalSets}</p>
            <p className="stat-label">Összes sorozat</p>
          </div>
          <div className="stat-block">
            <p className="font-mono text-4xl font-bold text-text-primary">
              {avgRir > 0 ? avgRir.toFixed(1) : '—'}
            </p>
            <p className="stat-label">Átlag RIR</p>
          </div>
        </div>
      </div>

      {/* Volume by Muscle Group */}
      <section className="px-5 py-4">
        <div className="section-header">
          <span className="section-title">Heti volumen izomcsoportonként</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : totalSets === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">Nincs rögzített edzés ezen a héten</p>
          </div>
        ) : (
          <div className="space-y-4">
            {volumeByMuscle.map((muscle) => {
              const guidelines = VOLUME_GUIDELINES[muscle.id]
              const progressPercent = Math.min((muscle.sets / guidelines.max) * 100, 100)

              return (
                <div key={muscle.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2" style={{ backgroundColor: muscle.color }} />
                      <span className="font-display text-sm uppercase tracking-wider text-text-primary">
                        {muscle.nameHu}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono text-lg font-bold',
                          muscle.status === 'low'
                            ? 'text-warning'
                            : muscle.status === 'high'
                              ? 'text-danger'
                              : 'text-success'
                        )}
                      >
                        {muscle.sets}
                      </span>
                      <span className="text-2xs text-text-muted">
                        /{guidelines.min}-{guidelines.max}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-bg-elevated relative">
                    {/* Optimal range indicator */}
                    <div
                      className="absolute h-full bg-success/20"
                      style={{
                        left: `${(guidelines.min / guidelines.max) * 100}%`,
                        width: `${((guidelines.optimal - guidelines.min) / guidelines.max) * 100}%`,
                      }}
                    />

                    {/* Actual progress */}
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        muscle.status === 'low'
                          ? 'bg-warning'
                          : muscle.status === 'high'
                            ? 'bg-danger'
                            : 'bg-success'
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Legend */}
      <section className="px-5 py-4 border-t border-text-muted/10">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning" />
            <span className="text-2xs text-text-muted uppercase tracking-wider">Kevés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success" />
            <span className="text-2xs text-text-muted uppercase tracking-wider">Optimális</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-danger" />
            <span className="text-2xs text-text-muted uppercase tracking-wider">Túl sok</span>
          </div>
        </div>
      </section>

      {/* Tips */}
      {totalSets > 0 && (
        <section className="px-5 py-4">
          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            <p className="text-2xs font-display uppercase tracking-wider text-accent mb-2">
              Tipp
            </p>
            <p className="text-text-secondary text-sm">
              {volumeByMuscle.some((m) => m.status === 'low')
                ? `A ${volumeByMuscle.find((m) => m.status === 'low')?.nameHu.toLowerCase()} kevés volument kapott ezen a héten. Fontold meg extra sorozatok hozzáadását.`
                : volumeByMuscle.some((m) => m.status === 'high')
                  ? 'Figyelem: néhány izomcsoportnál túl magas a volumen. Ez fáradtsághoz vezethet.'
                  : 'Remek munka! A volumen optimális tartományban van minden izomcsoportnál.'}
            </p>
          </div>
        </section>
      )}

      {/* Strength Benchmarks */}
      <section className="px-5 py-4 border-t border-text-muted/10">
        <div className="section-header">
          <span className="section-title">Erőszinted</span>
        </div>
        <StrengthBenchmarks />
      </section>
    </div>
  )
}
