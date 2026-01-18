import { getUser, getRecentSessions, getSetLogsForSession, getSetsInDateRange, getWeekStart, getLatestEstimatedMax, getRecentPRs, db } from '@/lib/db'
import { getTemplateById, getExerciseById, muscleGroups, getAvailableTemplatesBySplit } from '@/data'
import { calculateBWRatio, getStrengthLevel, BENCHMARK_LIFTS, getLevelNameHu, STRENGTH_STANDARDS, calculate1RM } from '@/lib/workout'
import {
  COACH_BEBI_SYSTEM_PROMPT,
  buildPostWorkoutPrompt,
  buildWeeklyReviewPrompt,
  buildAskCoachPrompt,
  buildComprehensiveWeeklyReviewPrompt,
  type UserProfile,
  type StrengthData,
  type VolumeData,
  type SessionSummary,
  type WeeklyReviewData,
} from './prompts'

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

// Gemini 3 Flash - Google's most balanced model for speed, scale, and frontier intelligence
// Model ID: gemini-3-flash-preview (as of December 2025)
// Docs: https://ai.google.dev/gemini-api/docs/models#gemini-3-flash
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

export interface CoachResponse {
  success: boolean
  message: string
  error?: string
}

/**
 * Get Gemini API key from environment or localStorage
 */
export function getGeminiApiKey(): string | null {
  // Check localStorage first (user-provided key)
  const storedKey = localStorage.getItem('gemini_api_key')
  if (storedKey) return storedKey

  // Check environment variable
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY
  }

  return null
}

/**
 * Save Gemini API key to localStorage
 */
export function saveGeminiApiKey(key: string): void {
  localStorage.setItem('gemini_api_key', key)
}

/**
 * Check if Gemini API key is configured
 */
export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey() !== null
}

/**
 * Call Gemini API
 */
async function callGemini(prompt: string): Promise<CoachResponse> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return {
      success: false,
      message: '',
      error: 'Nincs Gemini API kulcs beállítva. Add meg a beállításokban!',
    }
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: COACH_BEBI_SYSTEM_PROMPT },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: '',
        error: `API hiba: ${response.status} - ${errorData.error?.message || 'Ismeretlen hiba'}`,
      }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return {
        success: false,
        message: '',
        error: 'Üres válasz érkezett a Gemini API-tól',
      }
    }

    return {
      success: true,
      message: text,
    }
  } catch (error) {
    return {
      success: false,
      message: '',
      error: `Hálózati hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
    }
  }
}

/**
 * Get user profile for prompts
 */
async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getUser()
  if (!user) return null

  return {
    weightKg: user.currentWeightKg,
    gender: user.gender,
    age: user.birthYear ? new Date().getFullYear() - user.birthYear : undefined,
  }
}

/**
 * Get strength data for prompts
 */
async function getStrengthData(bodyweight: number): Promise<StrengthData> {
  const result: StrengthData = {}

  for (const [key, lift] of Object.entries(BENCHMARK_LIFTS)) {
    const estimated1RM = await getLatestEstimatedMax(lift.id)
    if (estimated1RM) {
      const ratio = calculateBWRatio(estimated1RM, bodyweight)
      const level = getStrengthLevel(key as keyof typeof BENCHMARK_LIFTS, ratio)
      result[key as keyof StrengthData] = {
        weight: estimated1RM,
        ratio,
        level: level ? getLevelNameHu(level) : 'Nincs adat',
      }
    }
  }

  return result
}

/**
 * Get weekly volume data for prompts
 */
async function getVolumeData(): Promise<VolumeData[]> {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const sets = await getSetsInDateRange(weekStart, weekEnd)

  // Group by muscle
  const volumeMap: Record<string, { sets: number; totalRir: number }> = {}
  muscleGroups.forEach((m) => {
    volumeMap[m.id] = { sets: 0, totalRir: 0 }
  })

  sets.forEach((set) => {
    const exercise = getExerciseById(set.exerciseId)
    if (exercise && volumeMap[exercise.muscleGroupPrimary]) {
      volumeMap[exercise.muscleGroupPrimary].sets += 1
      volumeMap[exercise.muscleGroupPrimary].totalRir += set.rir
    }
  })

  return muscleGroups
    .filter((m) => volumeMap[m.id].sets > 0)
    .map((m) => ({
      muscleGroup: m.nameHu,
      sets: volumeMap[m.id].sets,
      avgRir: volumeMap[m.id].sets > 0 ? volumeMap[m.id].totalRir / volumeMap[m.id].sets : 0,
    }))
}

/**
 * Get session summary for post-workout feedback
 */
async function getSessionSummary(sessionId: number): Promise<SessionSummary | null> {
  const sessions = await getRecentSessions(1)
  const session = sessions.find((s) => s.id === sessionId) || sessions[0]
  if (!session) return null

  const template = getTemplateById(session.templateId)
  const setLogs = await getSetLogsForSession(session.id!)

  // Group sets by exercise
  const exerciseMap: Record<string, typeof setLogs> = {}
  setLogs.forEach((set) => {
    if (!exerciseMap[set.exerciseId]) {
      exerciseMap[set.exerciseId] = []
    }
    exerciseMap[set.exerciseId].push(set)
  })

  const exercises = Object.entries(exerciseMap).map(([exerciseId, sets]) => {
    const exercise = getExerciseById(exerciseId)
    const sortedSets = [...sets].sort((a, b) => {
      // Sort by estimated 1RM (weight * reps approximation)
      return b.weightKg * b.reps - a.weightKg * a.reps
    })
    const topSet = sortedSets[0]
    const avgRir = sets.reduce((sum, s) => sum + s.rir, 0) / sets.length

    return {
      name: exercise?.nameHu || exerciseId,
      sets: sets.length,
      topSet: {
        weight: topSet.weightKg,
        reps: topSet.reps,
        rir: topSet.rir,
      },
      avgRir,
    }
  })

  const duration = session.completedAt
    ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : 0

  return {
    templateName: template?.nameHu || session.templateId,
    totalSets: setLogs.length,
    exercises,
    duration,
    date: session.date,
  }
}

/**
 * Get post-workout feedback from Coach Bebi
 */
export async function getPostWorkoutFeedback(sessionId: number): Promise<CoachResponse> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, message: '', error: 'Nincs felhasználói profil' }
  }

  const session = await getSessionSummary(sessionId)
  if (!session) {
    return { success: false, message: '', error: 'Nincs edzés adat' }
  }

  const prompt = buildPostWorkoutPrompt(profile, session)
  return callGemini(prompt)
}

/**
 * Get weekly review from Coach Bebi
 */
export async function getWeeklyReview(): Promise<CoachResponse> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, message: '', error: 'Nincs felhasználói profil' }
  }

  const strength = await getStrengthData(profile.weightKg)
  const volumes = await getVolumeData()

  // TODO: Calculate RIR trend from last few weeks
  const avgRirTrend: number[] = []

  const prompt = buildWeeklyReviewPrompt(profile, strength, volumes, avgRirTrend)
  return callGemini(prompt)
}

/**
 * Ask Coach Bebi a question
 */
export async function askCoachBebi(question: string): Promise<CoachResponse> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, message: '', error: 'Nincs felhasználói profil' }
  }

  const strength = await getStrengthData(profile.weightKg)
  const volumes = await getVolumeData()

  const prompt = buildAskCoachPrompt(profile, strength, volumes, question)
  return callGemini(prompt)
}

/**
 * Get comprehensive weekly review data
 */
async function getComprehensiveWeeklyData(): Promise<WeeklyReviewData | null> {
  const user = await getUser()
  if (!user) return null

  // Date ranges
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const twoWeeksAgoStart = new Date(lastWeekStart)
  twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7)

  // Get all sets for current and previous weeks
  const [currentWeekSets, lastWeekSets, twoWeeksAgoSets] = await Promise.all([
    getSetsInDateRange(weekStart, weekEnd),
    getSetsInDateRange(lastWeekStart, weekStart),
    getSetsInDateRange(twoWeeksAgoStart, lastWeekStart),
  ])

  // Get sessions for current week (for duration calculation)
  const sessions = await db.sessions
    .where('userId')
    .equals(user.id)
    .filter((s) => !!s.completedAt && new Date(s.date) >= weekStart && new Date(s.date) < weekEnd)
    .toArray()

  // Get PRs for this week
  const weekPRs = await getRecentPRs(weekStart, weekEnd)

  // Calculate basic stats
  const totalSessions = sessions.length
  const totalSets = currentWeekSets.length
  const totalReps = currentWeekSets.reduce((sum, s) => sum + s.reps, 0)
  const totalWeightLifted = currentWeekSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)

  // Average workout duration
  const durations = sessions
    .filter((s) => s.completedAt)
    .map((s) => (new Date(s.completedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000)
  const avgWorkoutDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

  // Planned workouts based on split type
  const templates = getAvailableTemplatesBySplit(user.splitType || 'bro-split')
  const plannedWorkouts = user.splitType === 'ppl' ? 6 : 5

  // Find missed workout types
  const completedTemplateIds = new Set(sessions.map((s) => s.templateId))
  const missedWorkoutTypes = templates
    .filter((t) => !completedTemplateIds.has(t.id))
    .map((t) => t.nameHu)
    .slice(0, 3)

  // Volume by muscle group
  const volumeByMuscle: WeeklyReviewData['volumeByMuscle'] = []
  const muscleMap: Record<string, { sets: number; totalRir: number }> = {}
  const lastWeekMuscleMap: Record<string, number> = {}

  muscleGroups.forEach((m) => {
    muscleMap[m.id] = { sets: 0, totalRir: 0 }
    lastWeekMuscleMap[m.id] = 0
  })

  currentWeekSets.forEach((set) => {
    const exercise = getExerciseById(set.exerciseId)
    if (exercise && muscleMap[exercise.muscleGroupPrimary]) {
      muscleMap[exercise.muscleGroupPrimary].sets += 1
      muscleMap[exercise.muscleGroupPrimary].totalRir += set.rir
    }
  })

  lastWeekSets.forEach((set) => {
    const exercise = getExerciseById(set.exerciseId)
    if (exercise && lastWeekMuscleMap[exercise.muscleGroupPrimary] !== undefined) {
      lastWeekMuscleMap[exercise.muscleGroupPrimary] += 1
    }
  })

  const undertrainedMuscles: string[] = []
  const overtrainedMuscles: string[] = []

  muscleGroups.forEach((muscle) => {
    const guidelines = VOLUME_GUIDELINES[muscle.id]
    if (!guidelines) return

    const data = muscleMap[muscle.id]
    const lastWeek = lastWeekMuscleMap[muscle.id]
    const avgRir = data.sets > 0 ? data.totalRir / data.sets : 0

    let status: 'low' | 'optimal' | 'high' = 'optimal'
    if (data.sets < guidelines.min) {
      status = 'low'
      if (data.sets > 0 || lastWeek > 0) undertrainedMuscles.push(muscle.nameHu)
    } else if (data.sets > guidelines.max) {
      status = 'high'
      overtrainedMuscles.push(muscle.nameHu)
    }

    const changePercent = lastWeek > 0 ? ((data.sets - lastWeek) / lastWeek) * 100 : data.sets > 0 ? 100 : 0

    if (data.sets > 0 || lastWeek > 0) {
      volumeByMuscle.push({
        muscle: muscle.nameHu,
        sets: data.sets,
        avgRir,
        status,
        minRecommended: guidelines.min,
        maxRecommended: guidelines.max,
        lastWeekSets: lastWeek,
        changePercent,
      })
    }
  })

  // RIR analysis
  const avgRir = currentWeekSets.length > 0
    ? currentWeekSets.reduce((sum, s) => sum + s.rir, 0) / currentWeekSets.length
    : 0

  const lastWeekAvgRir = lastWeekSets.length > 0
    ? lastWeekSets.reduce((sum, s) => sum + s.rir, 0) / lastWeekSets.length
    : 0

  // RIR distribution
  const rirCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  currentWeekSets.forEach((s) => {
    const rir = Math.min(Math.max(s.rir, 0), 4) as 0 | 1 | 2 | 3 | 4
    rirCounts[rir] += 1
  })

  const rirDistribution = Object.entries(rirCounts).map(([rir, count]) => ({
    rir: parseInt(rir),
    count,
    percent: totalSets > 0 ? (count / totalSets) * 100 : 0,
  }))

  // RIR trend
  let rirTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
  const rirDiff = avgRir - lastWeekAvgRir
  if (rirDiff < -0.3) rirTrend = 'decreasing' // getting harder = fatigue
  else if (rirDiff > 0.3) rirTrend = 'increasing' // getting easier

  // Progression analysis - compare exercises between weeks
  const progressions: WeeklyReviewData['progressions'] = []
  const regressions: WeeklyReviewData['regressions'] = []

  // Group sets by exercise for comparison
  const exerciseMaxWeights: Record<string, { current: number; last: number; name: string }> = {}

  currentWeekSets.forEach((set) => {
    const ex = getExerciseById(set.exerciseId)
    if (!ex) return
    if (!exerciseMaxWeights[set.exerciseId]) {
      exerciseMaxWeights[set.exerciseId] = { current: 0, last: 0, name: ex.nameHu }
    }
    if (set.weightKg > exerciseMaxWeights[set.exerciseId].current) {
      exerciseMaxWeights[set.exerciseId].current = set.weightKg
    }
  })

  lastWeekSets.forEach((set) => {
    if (!exerciseMaxWeights[set.exerciseId]) {
      const ex = getExerciseById(set.exerciseId)
      if (!ex) return
      exerciseMaxWeights[set.exerciseId] = { current: 0, last: 0, name: ex.nameHu }
    }
    if (set.weightKg > exerciseMaxWeights[set.exerciseId].last) {
      exerciseMaxWeights[set.exerciseId].last = set.weightKg
    }
  })

  Object.values(exerciseMaxWeights).forEach((data) => {
    if (data.current > 0 && data.last > 0) {
      const diff = data.current - data.last
      if (diff >= 2.5) {
        progressions.push({
          exercise: data.name,
          oldWeight: data.last,
          newWeight: data.current,
          increase: diff,
        })
      } else if (diff <= -2.5) {
        regressions.push({
          exercise: data.name,
          oldWeight: data.last,
          newWeight: data.current,
          decrease: diff,
        })
      }
    }
  })

  // Stalls - same weight for multiple weeks
  const stalls: WeeklyReviewData['stalls'] = []
  const twoWeeksAgoExerciseWeights: Record<string, number> = {}
  twoWeeksAgoSets.forEach((set) => {
    if (!twoWeeksAgoExerciseWeights[set.exerciseId] || set.weightKg > twoWeeksAgoExerciseWeights[set.exerciseId]) {
      twoWeeksAgoExerciseWeights[set.exerciseId] = set.weightKg
    }
  })

  Object.entries(exerciseMaxWeights).forEach(([exerciseId, data]) => {
    const twoWeeksAgo = twoWeeksAgoExerciseWeights[exerciseId]
    if (data.current > 0 && data.last > 0 && twoWeeksAgo && Math.abs(data.current - data.last) < 2.5 && Math.abs(data.last - twoWeeksAgo) < 2.5) {
      stalls.push({
        exercise: data.name,
        weight: data.current,
        weeksStalled: 3,
      })
    }
  })

  // Ready for progression - low RIR indicates room to increase
  const readyForProgression: WeeklyReviewData['readyForProgression'] = []
  const exerciseRirMap: Record<string, { avgRir: number; maxWeight: number; name: string; isCompound: boolean }> = {}

  currentWeekSets.forEach((set) => {
    const ex = getExerciseById(set.exerciseId)
    if (!ex) return
    if (!exerciseRirMap[set.exerciseId]) {
      exerciseRirMap[set.exerciseId] = { avgRir: 0, maxWeight: 0, name: ex.nameHu, isCompound: ex.type === 'compound' }
    }
    exerciseRirMap[set.exerciseId].avgRir += set.rir
    if (set.weightKg > exerciseRirMap[set.exerciseId].maxWeight) {
      exerciseRirMap[set.exerciseId].maxWeight = set.weightKg
    }
  })

  // Calculate average RIR per exercise
  const exerciseSetCounts: Record<string, number> = {}
  currentWeekSets.forEach((set) => {
    exerciseSetCounts[set.exerciseId] = (exerciseSetCounts[set.exerciseId] || 0) + 1
  })

  Object.entries(exerciseRirMap).forEach(([exerciseId, data]) => {
    const count = exerciseSetCounts[exerciseId] || 1
    data.avgRir = data.avgRir / count

    if (data.avgRir >= 2.5 && data.maxWeight > 0) {
      const increment = data.isCompound ? 2.5 : 1.25
      readyForProgression.push({
        exercise: data.name,
        currentWeight: data.maxWeight,
        suggestedWeight: data.maxWeight + increment * 2,
        reason: `átlag RIR ${data.avgRir.toFixed(1)} - túl könnyű!`,
      })
    }
  })

  // PRs this week
  const prsThisWeek = weekPRs.map((pr) => {
    const ex = getExerciseById(pr.exerciseId)
    return { exercise: ex?.nameHu || pr.exerciseId, weight: pr.weightKg, reps: pr.reps }
  })

  // Top sets by estimated 1RM
  const topSets = [...currentWeekSets]
    .map((set) => {
      const ex = getExerciseById(set.exerciseId)
      const estimated1RM = calculate1RM(set.weightKg, set.reps)
      return { exercise: ex?.nameHu || set.exerciseId, weight: set.weightKg, reps: set.reps, estimated1RM }
    })
    .sort((a, b) => b.estimated1RM - a.estimated1RM)
    .slice(0, 5)

  // Strength levels
  const strengthLevels: WeeklyReviewData['strengthLevels'] = []
  const bodyweight = user.currentWeightKg

  for (const [key, lift] of Object.entries(BENCHMARK_LIFTS)) {
    const estimated1RM = await getLatestEstimatedMax(lift.id)
    if (estimated1RM) {
      const bwRatio = calculateBWRatio(estimated1RM, bodyweight)
      const level = getStrengthLevel(key as keyof typeof BENCHMARK_LIFTS, bwRatio)
      const levelName = level ? getLevelNameHu(level) : 'Nincs adat'

      // Calculate next level target
      const standards = STRENGTH_STANDARDS[key as keyof typeof STRENGTH_STANDARDS]
      let nextLevelTarget = estimated1RM
      if (standards) {
        const levels = ['beginner', 'intermediate', 'advanced', 'elite'] as const
        const currentIdx = level ? levels.indexOf(level) : -1
        if (currentIdx < levels.length - 1) {
          const nextLevel = levels[currentIdx + 1]
          nextLevelTarget = standards[nextLevel] * bodyweight
        }
      }

      strengthLevels.push({
        lift: lift.nameHu,
        estimated1RM,
        bwRatio,
        level: levelName,
        nextLevelTarget,
      })
    }
  }

  // Last week comparison
  const lastWeekTotalSets = lastWeekSets.length
  const lastWeekTotalWeight = lastWeekSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
  const volumeChange = lastWeekTotalSets > 0 ? ((totalSets - lastWeekTotalSets) / lastWeekTotalSets) * 100 : totalSets > 0 ? 100 : 0

  // Deload detection
  let needsDeload = false
  let deloadReason: string | undefined

  if (rirTrend === 'decreasing' && avgRir < 1.5) {
    needsDeload = true
    deloadReason = 'Átlag RIR túl alacsony és csökkenő trend - fáradtság!'
  } else if (regressions.length >= 3) {
    needsDeload = true
    deloadReason = `${regressions.length} gyakorlatnál csökkent a súly - ideje regenerálódni!`
  } else if (stalls.length >= 4) {
    needsDeload = true
    deloadReason = 'Több gyakorlat is stagnál - lehet, hogy túledzett vagy.'
  }

  return {
    totalSessions,
    totalSets,
    totalReps,
    totalWeightLifted,
    avgWorkoutDuration,
    plannedWorkouts,
    completedWorkouts: totalSessions,
    completionRate: plannedWorkouts > 0 ? (totalSessions / plannedWorkouts) * 100 : 0,
    missedWorkoutTypes,
    volumeByMuscle,
    avgRir,
    rirDistribution,
    lastWeekAvgRir,
    rirTrend,
    progressions: progressions.slice(0, 5),
    regressions: regressions.slice(0, 5),
    stalls: stalls.slice(0, 5),
    readyForProgression: readyForProgression.slice(0, 5),
    prsThisWeek: prsThisWeek.slice(0, 5),
    topSets,
    skippedSets: 0, // Would need template comparison to calculate
    completionRateByExercise: [],
    strengthLevels,
    lastWeekTotalSets,
    lastWeekTotalWeight,
    volumeChange,
    undertrainedMuscles,
    overtrainedMuscles,
    needsDeload,
    deloadReason,
  }
}

/**
 * Get comprehensive weekly review from Coach Bebi
 */
export async function getComprehensiveWeeklyReview(): Promise<CoachResponse> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, message: '', error: 'Nincs felhasználói profil' }
  }

  const data = await getComprehensiveWeeklyData()
  if (!data) {
    return { success: false, message: '', error: 'Nem sikerült összegyűjteni az adatokat' }
  }

  if (data.totalSets === 0) {
    return {
      success: false,
      message: '',
      error: 'Nincs edzésadat ezen a héten! Előbb edzzél, aztán kérj értékelést.',
    }
  }

  const prompt = buildComprehensiveWeeklyReviewPrompt(profile, data)
  return callGemini(prompt)
}
