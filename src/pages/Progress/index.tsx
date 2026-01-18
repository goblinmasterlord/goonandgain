import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getSetsInDateRange,
  getWeekStart,
  getSessionCountInDateRange,
  getTotalWeightInDateRange,
  getRecentPRs,
  type PersonalRecord,
} from '@/lib/db'
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
  lastWeekSets: number
  change: number // percentage change from last week
}

type TabType = 'volume' | 'strength' | 'prs'

export function ProgressPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [sets, setSets] = useState<SetLog[]>([])
  const [lastWeekSets, setLastWeekSets] = useState<SetLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('volume')
  const [sessionCount, setSessionCount] = useState(0)
  const [totalWeight, setTotalWeight] = useState(0)
  const [lastWeekTotalWeight, setLastWeekTotalWeight] = useState(0)
  const [weekPRs, setWeekPRs] = useState<PersonalRecord[]>([])

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

  const lastWeekStart = useMemo(() => {
    const start = new Date(currentWeekStart)
    start.setDate(start.getDate() - 7)
    return start
  }, [currentWeekStart])

  useEffect(() => {
    loadWeekData()
  }, [currentWeekStart])

  const loadWeekData = async () => {
    setIsLoading(true)
    try {
      // Current week data
      const [weekSets, prevWeekSets, sessions, weight, prevWeight, prs] = await Promise.all([
        getSetsInDateRange(currentWeekStart, currentWeekEnd),
        getSetsInDateRange(lastWeekStart, currentWeekStart),
        getSessionCountInDateRange(currentWeekStart, currentWeekEnd),
        getTotalWeightInDateRange(currentWeekStart, currentWeekEnd),
        getTotalWeightInDateRange(lastWeekStart, currentWeekStart),
        getRecentPRs(currentWeekStart, currentWeekEnd),
      ])

      setSets(weekSets)
      setLastWeekSets(prevWeekSets)
      setSessionCount(sessions)
      setTotalWeight(weight)
      setLastWeekTotalWeight(prevWeight)
      setWeekPRs(prs)
    } catch (error) {
      console.error('Failed to load week data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate volume by muscle group with week-over-week comparison
  const volumeByMuscle = useMemo(() => {
    const volumeMap: Record<string, { sets: number; totalRir: number }> = {}
    const lastWeekVolumeMap: Record<string, number> = {}

    // Initialize all muscle groups
    muscleGroups.forEach((m) => {
      volumeMap[m.id] = { sets: 0, totalRir: 0 }
      lastWeekVolumeMap[m.id] = 0
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

    // Count last week's sets
    lastWeekSets.forEach((set) => {
      const exercise = getExerciseById(set.exerciseId)
      if (exercise) {
        const muscleId = exercise.muscleGroupPrimary
        if (lastWeekVolumeMap[muscleId] !== undefined) {
          lastWeekVolumeMap[muscleId] += 1
        }
      }
    })

    // Convert to array with status and comparison
    const result: MuscleVolume[] = muscleGroups
      .filter((m) => VOLUME_GUIDELINES[m.id])
      .map((muscle) => {
        const data = volumeMap[muscle.id]
        const lastWeek = lastWeekVolumeMap[muscle.id]
        const guidelines = VOLUME_GUIDELINES[muscle.id]
        const avgRir = data.sets > 0 ? data.totalRir / data.sets : 0

        let status: 'low' | 'optimal' | 'high' = 'optimal'
        if (data.sets < guidelines.min) status = 'low'
        else if (data.sets > guidelines.max) status = 'high'

        const change = lastWeek > 0 ? ((data.sets - lastWeek) / lastWeek) * 100 : data.sets > 0 ? 100 : 0

        return {
          id: muscle.id,
          nameHu: muscle.nameHu,
          color: muscle.color,
          sets: data.sets,
          avgRir: Math.round(avgRir * 10) / 10,
          status,
          lastWeekSets: lastWeek,
          change: Math.round(change),
        }
      })
      .sort((a, b) => b.sets - a.sets)

    return result
  }, [sets, lastWeekSets])

  // Calculate totals
  const totalSets = sets.length
  const lastWeekTotalSets = lastWeekSets.length
  const avgRir = sets.length > 0 ? sets.reduce((sum, s) => sum + s.rir, 0) / sets.length : 0
  const setsChange = lastWeekTotalSets > 0 ? ((totalSets - lastWeekTotalSets) / lastWeekTotalSets) * 100 : 0
  const weightChange = lastWeekTotalWeight > 0 ? ((totalWeight - lastWeekTotalWeight) / lastWeekTotalWeight) * 100 : 0

  const isCurrentWeek = weekOffset === 0

  const formatWeight = (weight: number): string => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}t`
    }
    return `${Math.round(weight)}kg`
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b-2 border-text-muted/20">
        <div className="px-4 py-3">
          <h1 className="font-display text-lg font-extrabold uppercase tracking-wide">Haladás</h1>
          <p className="text-text-muted text-xs mt-0.5">Statisztikák és teljesítmény</p>
        </div>
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

      {/* Weekly Summary Stats */}
      <div className="px-5 py-4 border-b border-text-muted/10">
        <div className="grid grid-cols-4 gap-2">
          {/* Sessions */}
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-accent">{sessionCount}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Edzés</p>
          </div>

          {/* Total Sets */}
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center relative">
            <p className="font-mono text-2xl font-bold text-text-primary">{totalSets}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Sorozat</p>
            {lastWeekTotalSets > 0 && (
              <span
                className={cn(
                  'absolute top-1 right-1 text-2xs font-mono',
                  setsChange > 0 ? 'text-success' : setsChange < 0 ? 'text-danger' : 'text-text-muted'
                )}
              >
                {setsChange > 0 ? '+' : ''}{Math.round(setsChange)}%
              </span>
            )}
          </div>

          {/* Total Weight */}
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center relative">
            <p className="font-mono text-2xl font-bold text-text-primary">{formatWeight(totalWeight)}</p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Összesen</p>
            {lastWeekTotalWeight > 0 && (
              <span
                className={cn(
                  'absolute top-1 right-1 text-2xs font-mono',
                  weightChange > 0 ? 'text-success' : weightChange < 0 ? 'text-danger' : 'text-text-muted'
                )}
              >
                {weightChange > 0 ? '+' : ''}{Math.round(weightChange)}%
              </span>
            )}
          </div>

          {/* Avg RIR */}
          <div className="p-3 bg-bg-secondary border border-text-muted/20 text-center">
            <p className="font-mono text-2xl font-bold text-text-primary">
              {avgRir > 0 ? avgRir.toFixed(1) : '—'}
            </p>
            <p className="text-2xs text-text-muted uppercase tracking-wider">Átlag RIR</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-5 py-3 border-b border-text-muted/10">
        <div className="flex gap-2">
          {[
            { id: 'volume' as const, label: 'Volumen' },
            { id: 'strength' as const, label: 'Erőszint' },
            { id: 'prs' as const, label: 'Rekordok' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-2 text-sm font-display uppercase tracking-wider transition-all',
                activeTab === tab.id
                  ? 'bg-accent text-bg-primary font-bold'
                  : 'bg-bg-elevated text-text-muted hover:text-text-primary'
              )}
            >
              {tab.label}
              {tab.id === 'prs' && weekPRs.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-success text-bg-primary text-2xs font-mono">
                  {weekPRs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'volume' && (
          <motion.div
            key="volume"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <VolumeTab
              volumeByMuscle={volumeByMuscle}
              totalSets={totalSets}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {activeTab === 'strength' && (
          <motion.div
            key="strength"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <StrengthTab />
          </motion.div>
        )}

        {activeTab === 'prs' && (
          <motion.div
            key="prs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <PRsTab prs={weekPRs} isCurrentWeek={isCurrentWeek} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface VolumeTabProps {
  volumeByMuscle: MuscleVolume[]
  totalSets: number
  isLoading: boolean
}

function VolumeTab({ volumeByMuscle, totalSets, isLoading }: VolumeTabProps) {
  return (
    <>
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
                      {/* Week-over-week change indicator */}
                      {muscle.lastWeekSets > 0 && muscle.change !== 0 && (
                        <span
                          className={cn(
                            'text-2xs font-mono',
                            muscle.change > 0 ? 'text-success' : 'text-danger'
                          )}
                        >
                          {muscle.change > 0 ? '↑' : '↓'}
                          {Math.abs(muscle.change)}%
                        </span>
                      )}
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
    </>
  )
}

function StrengthTab() {
  return (
    <section className="px-5 py-4">
      <div className="section-header">
        <span className="section-title">Erőszinted</span>
      </div>
      <StrengthBenchmarks />
    </section>
  )
}

interface PRsTabProps {
  prs: PersonalRecord[]
  isCurrentWeek: boolean
}

function PRsTab({ prs, isCurrentWeek }: PRsTabProps) {
  if (prs.length === 0) {
    return (
      <section className="px-5 py-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-2 border-text-muted/30 flex items-center justify-center mb-4 mx-auto">
            <svg
              className="w-8 h-8 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="square"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-2">
            {isCurrentWeek ? 'Még nincs rekord ezen a héten' : 'Nem volt rekord ezen a héten'}
          </h2>
          <p className="text-text-muted text-sm">
            {isCurrentWeek
              ? 'Folytasd a kemény munkát, a rekordok jönnek!'
              : 'Ezen a héten nem döntöttél meg egyéni rekordot.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-5 py-4">
      <div className="section-header mb-4">
        <span className="section-title">
          {isCurrentWeek ? 'Ezen a héten elért rekordok' : 'Elért rekordok'}
        </span>
      </div>

      <div className="space-y-3">
        {prs.map((pr) => {
          const exercise = getExerciseById(pr.exerciseId)
          const muscle = exercise
            ? muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)
            : null

          return (
            <div
              key={pr.exerciseId}
              className="p-4 bg-bg-secondary border border-success/30 flex items-center gap-4"
            >
              {/* Trophy icon */}
              <div className="w-10 h-10 bg-success/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="square"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>

              {/* Exercise info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-4"
                    style={{ backgroundColor: muscle?.color || '#8a8a8a' }}
                  />
                  <h3 className="font-display font-bold text-text-primary uppercase tracking-wide truncate">
                    {exercise?.nameHu || pr.exerciseId}
                  </h3>
                </div>
                <p className="text-2xs text-text-muted mt-1">
                  {format(new Date(pr.date), 'MMMM d.', { locale: hu })}
                </p>
              </div>

              {/* PR value */}
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-success">
                  {pr.weightKg}
                  <span className="text-sm text-text-muted">kg</span>
                </p>
                <p className="text-2xs text-text-muted">
                  × {pr.reps} rep
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Motivational message */}
      <div className="mt-6 p-4 bg-success/10 border border-success/30 text-center">
        <p className="text-success font-display uppercase tracking-wider text-sm font-bold">
          {prs.length === 1 ? '1 új rekord!' : `${prs.length} új rekord!`}
        </p>
        <p className="text-text-secondary text-sm mt-1">
          Folyamatosan fejlődsz. Tartsd ezt a tempót!
        </p>
      </div>
    </section>
  )
}
