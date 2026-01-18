import type { StrengthLevel } from '@/types'

// The 4 main lifts for strength benchmarking
export const BENCHMARK_LIFTS = {
  squat: {
    id: 'barbell-back-squat',
    nameHu: 'Guggolás',
    nameEn: 'Squat',
    key: 'squat' as const,
  },
  bench: {
    id: 'flat-barbell-bench-press',
    nameHu: 'Fekvenyomás',
    nameEn: 'Bench Press',
    key: 'bench' as const,
  },
  deadlift: {
    id: 'deadlift',
    nameHu: 'Felhúzás',
    nameEn: 'Deadlift',
    key: 'deadlift' as const,
  },
  ohp: {
    id: 'overhead-press-barbell',
    nameHu: 'Vállból nyomás',
    nameEn: 'Overhead Press',
    key: 'ohp' as const,
  },
} as const

export type BenchmarkLiftKey = keyof typeof BENCHMARK_LIFTS

export interface StrengthBenchmark {
  liftKey: BenchmarkLiftKey
  nameHu: string
  exerciseId: string
  estimated1RM: number | null
  bodyweightRatio: number | null
  currentLevel: StrengthLevel | null
  progressToNextLevel: number // 0-100 percentage
  nextLevel: StrengthLevel | null
  targetForNextLevel: number | null
}

const LEVEL_ORDER: StrengthLevel[] = ['beginner', 'intermediate', 'advanced', 'elite']

// Exported strength standards for use in other modules
export const STRENGTH_STANDARDS = {
  squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
  bench: { beginner: 0.75, intermediate: 1.2, advanced: 1.5, elite: 1.8 },
  deadlift: { beginner: 1.25, intermediate: 2.0, advanced: 2.5, elite: 3.0 },
  ohp: { beginner: 0.5, intermediate: 0.8, advanced: 1.0, elite: 1.2 },
} as const

const LEVEL_NAMES_HU: Record<StrengthLevel, string> = {
  beginner: 'Kezdő',
  intermediate: 'Középhaladó',
  advanced: 'Haladó',
  elite: 'Elit',
}

export function getLevelNameHu(level: StrengthLevel): string {
  return LEVEL_NAMES_HU[level]
}

/**
 * Calculate bodyweight ratio for a lift
 */
export function calculateBWRatio(weight1RM: number, bodyweight: number): number {
  if (bodyweight <= 0) return 0
  return Math.round((weight1RM / bodyweight) * 100) / 100
}

/**
 * Determine strength level based on bodyweight ratio
 */
export function getStrengthLevel(
  liftKey: BenchmarkLiftKey,
  bwRatio: number
): StrengthLevel | null {
  if (bwRatio <= 0) return null

  const standards = {
    squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
    bench: { beginner: 0.75, intermediate: 1.2, advanced: 1.5, elite: 1.8 },
    deadlift: { beginner: 1.25, intermediate: 2.0, advanced: 2.5, elite: 3.0 },
    ohp: { beginner: 0.5, intermediate: 0.8, advanced: 1.0, elite: 1.2 },
  }

  const liftStandards = standards[liftKey]

  // Check from highest to lowest
  if (bwRatio >= liftStandards.elite) return 'elite'
  if (bwRatio >= liftStandards.advanced) return 'advanced'
  if (bwRatio >= liftStandards.intermediate) return 'intermediate'
  if (bwRatio >= liftStandards.beginner) return 'beginner'

  return null // Below beginner
}

/**
 * Get the next level after current
 */
export function getNextLevel(currentLevel: StrengthLevel | null): StrengthLevel | null {
  if (!currentLevel) return 'beginner'
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
  if (currentIndex >= LEVEL_ORDER.length - 1) return null // Already elite
  return LEVEL_ORDER[currentIndex + 1]
}

/**
 * Calculate progress percentage toward next level
 */
export function calculateProgressToNextLevel(
  liftKey: BenchmarkLiftKey,
  bwRatio: number
): { progress: number; nextLevel: StrengthLevel | null; targetRatio: number | null } {
  const standards = {
    squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
    bench: { beginner: 0.75, intermediate: 1.2, advanced: 1.5, elite: 1.8 },
    deadlift: { beginner: 1.25, intermediate: 2.0, advanced: 2.5, elite: 3.0 },
    ohp: { beginner: 0.5, intermediate: 0.8, advanced: 1.0, elite: 1.2 },
  }

  const liftStandards = standards[liftKey]

  // If already elite, return 100%
  if (bwRatio >= liftStandards.elite) {
    return { progress: 100, nextLevel: null, targetRatio: null }
  }

  // Find which range we're in
  const levels = LEVEL_ORDER
  for (let i = 0; i < levels.length; i++) {
    const currentLevelRatio = i === 0 ? 0 : liftStandards[levels[i - 1]]
    const nextLevelRatio = liftStandards[levels[i]]

    if (bwRatio < nextLevelRatio) {
      const range = nextLevelRatio - currentLevelRatio
      const progressInRange = bwRatio - currentLevelRatio
      const progress = Math.min(100, Math.max(0, (progressInRange / range) * 100))
      return {
        progress: Math.round(progress),
        nextLevel: levels[i],
        targetRatio: nextLevelRatio,
      }
    }
  }

  return { progress: 100, nextLevel: null, targetRatio: null }
}

/**
 * Calculate full strength benchmark for a lift
 */
export function calculateBenchmark(
  liftKey: BenchmarkLiftKey,
  estimated1RM: number | null,
  bodyweight: number
): StrengthBenchmark {
  const lift = BENCHMARK_LIFTS[liftKey]

  if (!estimated1RM || estimated1RM <= 0 || bodyweight <= 0) {
    return {
      liftKey,
      nameHu: lift.nameHu,
      exerciseId: lift.id,
      estimated1RM: null,
      bodyweightRatio: null,
      currentLevel: null,
      progressToNextLevel: 0,
      nextLevel: 'beginner',
      targetForNextLevel: null,
    }
  }

  const bwRatio = calculateBWRatio(estimated1RM, bodyweight)
  const currentLevel = getStrengthLevel(liftKey, bwRatio)
  const { progress, nextLevel, targetRatio } = calculateProgressToNextLevel(liftKey, bwRatio)

  return {
    liftKey,
    nameHu: lift.nameHu,
    exerciseId: lift.id,
    estimated1RM,
    bodyweightRatio: bwRatio,
    currentLevel,
    progressToNextLevel: progress,
    nextLevel,
    targetForNextLevel: targetRatio ? Math.ceil(targetRatio * bodyweight) : null,
  }
}

/**
 * Get the color for a strength level
 */
export function getLevelColor(level: StrengthLevel | null): string {
  switch (level) {
    case 'elite':
      return '#ffd700' // Gold
    case 'advanced':
      return '#9333ea' // Purple
    case 'intermediate':
      return '#00d4aa' // Teal (success)
    case 'beginner':
      return '#ff4d00' // Accent orange
    default:
      return '#4a4a4a' // Muted
  }
}
