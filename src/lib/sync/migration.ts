import { db, getUser } from '@/lib/db'
import { getSupabase, isSupabaseConfigured, isOnline } from './supabaseClient'
import { setMigrated, isMigrated } from './syncService'

export interface MigrationResult {
  success: boolean
  alreadyMigrated?: boolean
  error?: string
  stats?: {
    sessions: number
    setLogs: number
    weightHistory: number
    estimatedMaxes: number
  }
}

/**
 * Migrate all existing local data to Supabase
 * This is run once when user first connects to cloud
 */
export async function migrateLocalDataToSupabase(): Promise<MigrationResult> {
  // Check prerequisites
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  if (!isOnline()) {
    return { success: false, error: 'No internet connection' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' }
  }

  const user = await getUser()
  if (!user) {
    return { success: false, error: 'No local user found' }
  }

  // Check if already migrated
  if (isMigrated()) {
    return { success: true, alreadyMigrated: true }
  }

  try {
    // Check if user exists in Supabase
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      // User already exists in Supabase, mark as migrated
      setMigrated(true)
      return { success: true, alreadyMigrated: true }
    }

    // If error is not "no rows", something went wrong
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    console.info('[Migration] Starting migration for user:', user.id)

    // 1. Create user in Supabase (profile_name and PIN are set via registerProfile)
    const { error: userError } = await supabase.from('users').insert({
      id: user.id,
      created_at: user.createdAt.toISOString(),
      current_weight_kg: user.currentWeightKg,
      gender: user.gender,
      birth_year: user.birthYear || null,
      training_days: user.trainingDays || {},
      weight_updated_at: user.weightUpdatedAt.toISOString(),
      split_type: user.splitType || 'bro-split',
      profile_name: user.profileName || null,
    })
    if (userError) throw userError
    console.info('[Migration] User created')

    // 2. Migrate weight history
    const weightHistory = await db.weightHistory.toArray()
    let weightHistoryCount = 0
    if (weightHistory.length > 0) {
      const { error: weightError } = await supabase.from('weight_history').insert(
        weightHistory.map((w) => ({
          user_id: user.id,
          weight_kg: w.weightKg,
          recorded_at: w.recordedAt instanceof Date ? w.recordedAt.toISOString() : w.recordedAt,
        }))
      )
      if (weightError) throw weightError
      weightHistoryCount = weightHistory.length
      console.info(`[Migration] Weight history: ${weightHistoryCount} records`)
    }

    // 3. Migrate sessions with set logs
    const sessions = await db.sessions.toArray()
    let sessionCount = 0
    let setLogCount = 0

    for (const session of sessions) {
      if (!session.id) continue

      // Insert session
      const { data: insertedSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          template_id: session.templateId,
          date: session.date instanceof Date ? session.date.toISOString().split('T')[0] : session.date,
          started_at: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
          completed_at: session.completedAt
            ? session.completedAt instanceof Date
              ? session.completedAt.toISOString()
              : session.completedAt
            : null,
          notes: session.notes || null,
          local_id: session.id,
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError
      sessionCount++

      // Get set logs for this session
      const setLogs = await db.setLogs
        .where('sessionId')
        .equals(session.id)
        .toArray()

      if (setLogs.length > 0 && insertedSession) {
        const { error: setError } = await supabase.from('set_logs').insert(
          setLogs.map((s) => ({
            session_id: insertedSession.id,
            exercise_id: s.exerciseId,
            set_number: s.setNumber,
            weight_kg: s.weightKg,
            added_weight_kg: s.addedWeightKg || null,
            reps: s.reps,
            rir: s.rir,
            logged_at: s.loggedAt instanceof Date ? s.loggedAt.toISOString() : s.loggedAt,
            local_id: s.id!,
          }))
        )
        if (setError) throw setError
        setLogCount += setLogs.length
      }
    }
    console.info(`[Migration] Sessions: ${sessionCount}, Set logs: ${setLogCount}`)

    // 4. Migrate estimated maxes
    const estimatedMaxes = await db.estimatedMaxes.toArray()
    let estimatedMaxCount = 0
    if (estimatedMaxes.length > 0) {
      const { error: maxError } = await supabase.from('estimated_maxes').insert(
        estimatedMaxes.map((m) => ({
          user_id: user.id,
          exercise_id: m.exerciseId,
          estimated_1rm: m.estimated1RM,
          calculated_at: m.calculatedAt instanceof Date ? m.calculatedAt.toISOString() : m.calculatedAt,
          local_id: m.id!,
        }))
      )
      if (maxError) throw maxError
      estimatedMaxCount = estimatedMaxes.length
      console.info(`[Migration] Estimated maxes: ${estimatedMaxCount}`)
    }

    // 5. Migrate AI feedback (if any)
    const aiFeedback = await db.aiFeedback.toArray()
    if (aiFeedback.length > 0) {
      const { error: feedbackError } = await supabase.from('ai_feedback').insert(
        aiFeedback.map((f) => ({
          user_id: user.id,
          type: f.type,
          content: f.content,
          data_snapshot: f.dataSnapshot ? JSON.parse(f.dataSnapshot) : null,
          created_at: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
          local_id: f.id!,
        }))
      )
      if (feedbackError) throw feedbackError
      console.info(`[Migration] AI feedback: ${aiFeedback.length}`)
    }

    // Mark as migrated
    setMigrated(true)
    console.info('[Migration] Complete!')

    return {
      success: true,
      stats: {
        sessions: sessionCount,
        setLogs: setLogCount,
        weightHistory: weightHistoryCount,
        estimatedMaxes: estimatedMaxCount,
      },
    }
  } catch (error) {
    console.error('[Migration] Failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Reset migration status (for debugging/testing)
 */
export function resetMigration(): void {
  setMigrated(false)
}
