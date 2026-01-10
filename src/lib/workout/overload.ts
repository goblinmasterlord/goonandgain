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
  finalSetWeight: number
  finalSetReps: number
  finalSetRir: number
  totalSets: number
  estimated1RM: number
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
 * Analyze last session data for an exercise
 */
export function analyzeLastSession(sets: SetLog[]): LastSessionAnalysis | null {
  if (!sets || sets.length === 0) return null

  const sortedSets = [...sets].sort((a, b) => a.setNumber - b.setNumber)
  const finalSet = sortedSets[sortedSets.length - 1]

  const totalWeight = sets.reduce((sum, s) => sum + s.weightKg, 0)
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0)
  const totalRir = sets.reduce((sum, s) => sum + s.rir, 0)

  // Calculate 1RM from the best set (highest weight with most reps)
  const bestSet = sets.reduce((best, current) => {
    const best1RM = calculate1RM(best.weightKg, best.reps)
    const current1RM = calculate1RM(current.weightKg, current.reps)
    return current1RM > best1RM ? current : best
  }, sets[0])

  return {
    avgWeight: Math.round((totalWeight / sets.length) * 10) / 10,
    avgReps: Math.round((totalReps / sets.length) * 10) / 10,
    avgRir: Math.round((totalRir / sets.length) * 10) / 10,
    finalSetWeight: finalSet.weightKg,
    finalSetReps: finalSet.reps,
    finalSetRir: finalSet.rir,
    totalSets: sets.length,
    estimated1RM: calculate1RM(bestSet.weightKg, bestSet.reps),
  }
}

/**
 * Progressive Overload Algorithm
 * Based on PRD section 4.4
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

  const { finalSetWeight, finalSetReps, finalSetRir } = analysis
  const isCompound = exercise.type === 'compound'
  const smallIncrement = isCompound ? 2.5 : 1.25
  const largeIncrement = isCompound ? 5 : 2.5

  let suggestedWeight: number
  let message: string
  let messageType: OverloadSuggestion['messageType']

  // Algorithm from PRD 4.4
  if (finalSetRir <= 1) {
    // At limit - maintain weight
    suggestedWeight = finalSetWeight
    message = 'Tartsd a súlyt! Közel jártál a maximumodhoz.'
    messageType = 'maintain'
  } else if (finalSetRir === 2 && finalSetReps >= repMax) {
    // Ready to progress - hit top of rep range with RIR 2
    suggestedWeight = roundToIncrement(finalSetWeight + smallIncrement)
    message = `Progresszió! Elérted a ${repMax} ismétlést, ideje növelni a súlyt.`
    messageType = 'progress'
  } else if (finalSetRir >= 3) {
    // Too easy - significant increase
    suggestedWeight = roundToIncrement(finalSetWeight + largeIncrement)
    message = 'A súly könnyű volt. Növeld meg a terhelést!'
    messageType = 'easy'
  } else if (finalSetReps < repMin) {
    // Failed to hit minimum reps - reduce by 10%
    suggestedWeight = roundToIncrement(finalSetWeight * 0.9)
    message = `Nem sikerült elérni a ${repMin} ismétlést. Csökkentsd a súlyt a helyes formáért.`
    messageType = 'reduce'
  } else {
    // Standard case - RIR 2 but not at top of rep range yet
    // Maintain or small increase if doing well
    if (finalSetReps >= (repMin + repMax) / 2) {
      // Above midpoint of rep range with RIR 2 - small progress possible
      suggestedWeight = roundToIncrement(finalSetWeight + smallIncrement * 0.5)
      message = 'Jó teljesítmény! Próbálj több ismétlést vagy kis súlynövelést.'
      messageType = 'maintain'
    } else {
      suggestedWeight = finalSetWeight
      message = 'Tartsd a súlyt és célozd meg a több ismétlést a haladáshoz.'
      messageType = 'maintain'
    }
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
 */
export function formatLastSessionDisplay(sets: SetLog[]): string | null {
  if (!sets || sets.length === 0) return null

  const analysis = analyzeLastSession(sets)
  if (!analysis) return null

  return `${analysis.finalSetWeight}kg × ${analysis.finalSetReps} @ RIR ${analysis.finalSetRir}`
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
