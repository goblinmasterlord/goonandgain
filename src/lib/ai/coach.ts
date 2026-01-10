import { getUser, getRecentSessions, getSetLogsForSession, getSetsInDateRange, getWeekStart, getLatestEstimatedMax } from '@/lib/db'
import { getTemplateById, getExerciseById, muscleGroups } from '@/data'
import { calculateBWRatio, getStrengthLevel, BENCHMARK_LIFTS, getLevelNameHu } from '@/lib/workout'
import {
  COACH_BEBI_SYSTEM_PROMPT,
  buildPostWorkoutPrompt,
  buildWeeklyReviewPrompt,
  buildAskCoachPrompt,
  type UserProfile,
  type StrengthData,
  type VolumeData,
  type SessionSummary,
} from './prompts'

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
          maxOutputTokens: 1024,
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
