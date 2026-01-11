import type { SetLog, Exercise } from '@/types'

export interface OverloadSuggestion {
  suggestedWeight: number
  targetReps: { min: number; max: number }
  message: string
  messageType: 'progress' | 'maintain' | 'reduce' | 'easy'
}

export interface LastSessionAnalysis {
  avgWeight: number
  avgReps: number
  avgRir: number
  // Working sets analysis (excluding max attempts)
  workingSetWeight: number // Median weight of working sets
  workingSetReps: number   // Median reps of working sets
  workingSetRir: number    // Median RIR of working sets
  workingSetsCount: number // Number of actual working sets
  // Legacy fields for backwards compatibility
  finalSetWeight: number
  finalSetReps: number
  finalSetRir: number
  totalSets: number
  estimated1RM: number
  // Max attempt tracking
  hasMaxAttempt: boolean
  maxAttempt1RM: number | null
}

/**
 * Calculate estimated 1RM using Brzycki formula
 * 1RM = weight × (36 / (37 - reps))
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps >= 37) return weight // Edge case: too many reps
  if (reps <= 0 || weight <= 0) return 0
  return Math.round(weight * (36 / (37 - reps)) * 10) / 10
}

/**
 * Round weight to nearest 2.5kg increment
 */
export function roundToIncrement(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment
}

/**
 * Detect if a set is a max attempt (heavy single) vs a working set
 * A max attempt is characterized by:
 * - Significantly higher weight than other sets (15%+ above median)
 * - Very low reps (1-3 reps)
 * - Or explicitly marked as isMaxAttempt
 */
export function isMaxAttemptSet(set: SetLog, allSets: SetLog[]): boolean {
  // If explicitly marked, use that
  if (set.isMaxAttempt !== undefined) return set.isMaxAttempt

  // Need at least 2 sets to compare
  if (allSets.length < 2) return false

  // Heavy single detection: 1-3 reps with significantly higher weight
  if (set.reps > 3) return false

  // Calculate median weight of all sets
  const weights = allSets.map(s => s.weightKg).sort((a, b) => a - b)
  const medianWeight = weights[Math.floor(weights.length / 2)]

  // If this set is 15%+ heavier than median and has ≤3 reps, it's likely a max attempt
  const threshold = medianWeight * 1.15
  return set.weightKg >= threshold && set.reps <= 3
}

/**
 * Get median value from an array of numbers
 */
function getMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Analyze last session data for an exercise
 * Now separates working sets from max attempts for better progression suggestions
 */
export function analyzeLastSession(sets: SetLog[]): LastSessionAnalysis | null {
  if (!sets || sets.length === 0) return null

  const sortedSets = [...sets].sort((a, b) => a.setNumber - b.setNumber)
  const finalSet = sortedSets[sortedSets.length - 1]

  // Separate working sets from max attempts
  const workingSets = sets.filter(s => !isMaxAttemptSet(s, sets))
  const maxAttemptSets = sets.filter(s => isMaxAttemptSet(s, sets))

  // Use working sets for progression (or all sets if no working sets identified)
  const setsForProgression = workingSets.length > 0 ? workingSets : sets

  const totalWeight = sets.reduce((sum, s) => sum + s.weightKg, 0)
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0)
  const totalRir = sets.reduce((sum, s) => sum + s.rir, 0)

  // Calculate working set metrics (median values for robustness)
  const workingWeights = setsForProgression.map(s => s.weightKg)
  const workingReps = setsForProgression.map(s => s.reps)
  const workingRirs = setsForProgression.map(s => s.rir)

  // Calculate 1RM from the best set (highest weight with most reps)
  const bestSet = sets.reduce((best, current) => {
    const best1RM = calculate1RM(best.weightKg, best.reps)
    const current1RM = calculate1RM(current.weightKg, current.reps)
    return current1RM > best1RM ? current : best
  }, sets[0])

  // Calculate max attempt 1RM if any
  let maxAttempt1RM: number | null = null
  if (maxAttemptSets.length > 0) {
    const bestMaxAttempt = maxAttemptSets.reduce((best, current) => {
      const best1RM = calculate1RM(best.weightKg, best.reps)
      const current1RM = calculate1RM(current.weightKg, current.reps)
      return current1RM > best1RM ? current : best
    }, maxAttemptSets[0])
    maxAttempt1RM = calculate1RM(bestMaxAttempt.weightKg, bestMaxAttempt.reps)
  }

  // For the "final set" metrics, use the last working set (not max attempt)
  const lastWorkingSet = [...setsForProgression].sort((a, b) => a.setNumber - b.setNumber).pop() || finalSet

  return {
    avgWeight: Math.round((totalWeight / sets.length) * 10) / 10,
    avgReps: Math.round((totalReps / sets.length) * 10) / 10,
    avgRir: Math.round((totalRir / sets.length) * 10) / 10,
    // Working sets analysis
    workingSetWeight: Math.round(getMedian(workingWeights) * 10) / 10,
    workingSetReps: Math.round(getMedian(workingReps)),
    workingSetRir: Math.round(getMedian(workingRirs) * 10) / 10,
    workingSetsCount: workingSets.length,
    // Legacy fields - now based on working sets
    finalSetWeight: lastWorkingSet.weightKg,
    finalSetReps: lastWorkingSet.reps,
    finalSetRir: lastWorkingSet.rir,
    totalSets: sets.length,
    estimated1RM: calculate1RM(bestSet.weightKg, bestSet.reps),
    // Max attempt info
    hasMaxAttempt: maxAttemptSets.length > 0,
    maxAttempt1RM,
  }
}

/**
 * Progressive Overload Algorithm
 * Based on PRD section 4.4, enhanced with:
 * - RIR 0 support (true failure)
 * - Max attempt detection (heavy singles excluded from progression)
 * - Uses working set data (median) instead of final set for more accurate suggestions
 */
export function calculateOverloadSuggestion(
  exercise: Exercise,
  lastSessionSets: SetLog[],
  targetRepMin?: number,
  targetRepMax?: number
): OverloadSuggestion {
  const repMin = targetRepMin ?? exercise.defaultRepRangeMin
  const repMax = targetRepMax ?? exercise.defaultRepRangeMax

  // Default suggestion for first session
  const defaultSuggestion: OverloadSuggestion = {
    suggestedWeight: 0, // User enters their first weight
    targetReps: { min: repMin, max: repMax },
    message: 'Első alkalom! Válassz egy súlyt, amivel biztonságosan tudod végrehajtani a gyakorlatot.',
    messageType: 'maintain',
  }

  if (!lastSessionSets || lastSessionSets.length === 0) {
    return defaultSuggestion
  }

  const analysis = analyzeLastSession(lastSessionSets)
  if (!analysis) return defaultSuggestion

  // Use working set data for progression (excludes max attempts)
  const { workingSetWeight, workingSetReps, workingSetRir, hasMaxAttempt, workingSetsCount } = analysis
  const isCompound = exercise.type === 'compound'
  const smallIncrement = isCompound ? 2.5 : 1.25
  const largeIncrement = isCompound ? 5 : 2.5

  let suggestedWeight: number
  let message: string
  let messageType: OverloadSuggestion['messageType']

  // If no working sets (all were max attempts), use the analysis fallback
  if (workingSetsCount === 0) {
    suggestedWeight = analysis.avgWeight
    message = 'Előző edzés csak max kísérletekből állt. Válassz munkasúlyt a normál edzéshez.'
    messageType = 'maintain'
    return { suggestedWeight: roundToIncrement(suggestedWeight), targetReps: { min: repMin, max: repMax }, message, messageType }
  }

  // Enhanced algorithm with RIR 0 support
  if (workingSetRir === 0) {
    // RIR 0 = true failure - reduce weight slightly for sustainable training
    suggestedWeight = roundToIncrement(workingSetWeight * 0.95)
    message = 'Teljes kimerülésig mentél. Csökkentsd egy kicsit a súlyt a fenntartható edzéshez.'
    messageType = 'reduce'
  } else if (workingSetRir <= 1) {
    // RIR 1 = At limit - maintain weight
    suggestedWeight = workingSetWeight
    message = 'Tartsd a súlyt! Közel jártál a maximumodhoz.'
    messageType = 'maintain'
  } else if (workingSetRir === 2 && workingSetReps >= repMax) {
    // Ready to progress - hit top of rep range with RIR 2
    suggestedWeight = roundToIncrement(workingSetWeight + smallIncrement)
    message = `Progresszió! Elérted a ${repMax} ismétlést, ideje növelni a súlyt.`
    messageType = 'progress'
  } else if (workingSetRir >= 3) {
    // Too easy - significant increase
    suggestedWeight = roundToIncrement(workingSetWeight + largeIncrement)
    message = 'A súly könnyű volt. Növeld meg a terhelést!'
    messageType = 'easy'
  } else if (workingSetReps < repMin) {
    // Failed to hit minimum reps - reduce by 10%
    suggestedWeight = roundToIncrement(workingSetWeight * 0.9)
    message = `Nem sikerült elérni a ${repMin} ismétlést. Csökkentsd a súlyt a helyes formáért.`
    messageType = 'reduce'
  } else {
    // Standard case - RIR 2 but not at top of rep range yet
    // Maintain or small increase if doing well
    if (workingSetReps >= (repMin + repMax) / 2) {
      // Above midpoint of rep range with RIR 2 - small progress possible
      suggestedWeight = roundToIncrement(workingSetWeight + smallIncrement * 0.5)
      message = 'Jó teljesítmény! Próbálj több ismétlést vagy kis súlynövelést.'
      messageType = 'maintain'
    } else {
      suggestedWeight = workingSetWeight
      message = 'Tartsd a súlyt és célozd meg a több ismétlést a haladáshoz.'
      messageType = 'maintain'
    }
  }

  // Add note about detected max attempt
  if (hasMaxAttempt) {
    message += ' (Max kísérlet figyelmen kívül hagyva)'
  }

  return {
    suggestedWeight,
    targetReps: { min: repMin, max: repMax },
    message,
    messageType,
  }
}

/**
 * Format last session data for display
 * Shows working set data, with max attempt noted if present
 */
export function formatLastSessionDisplay(sets: SetLog[]): string | null {
  if (!sets || sets.length === 0) return null

  const analysis = analyzeLastSession(sets)
  if (!analysis) return null

  let display = `${analysis.workingSetWeight}kg × ${analysis.workingSetReps} @ RIR ${analysis.workingSetRir}`

  // Add max attempt info if present
  if (analysis.hasMaxAttempt && analysis.maxAttempt1RM) {
    display += ` (Max: ~${Math.round(analysis.maxAttempt1RM)}kg 1RM)`
  }

  return display
}

/**
 * Get progress indicator emoji based on suggestion
 */
export function getProgressIndicator(messageType: OverloadSuggestion['messageType']): string {
  switch (messageType) {
    case 'progress':
      return '↗️'
    case 'easy':
      return '⚡'
    case 'reduce':
      return '↘️'
    case 'maintain':
    default:
      return '→'
  }
}
