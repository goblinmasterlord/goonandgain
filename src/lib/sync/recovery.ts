/**
 * Profile Recovery Functions
 * Handles profile name registration, verification, and data recovery from Supabase
 */

import { db } from '@/lib/db'
import type { User, SplitType, TrainingDays } from '@/types'
import { getSupabase, isSupabaseConfigured, isOnline } from './supabaseClient'
import { setMigrated } from './syncService'
import type { RecoveryResult } from './types'

/**
 * Check if a profile name is available (case-insensitive)
 */
export async function checkProfileNameAvailable(name: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isOnline()) {
    // If offline/not configured, assume available (will be checked during sync)
    return true
  }

  const supabase = getSupabase()
  if (!supabase) return true

  const { data, error } = await supabase.rpc('check_profile_name_available', {
    p_name: name,
  })

  if (error) {
    console.error('[Recovery] Error checking profile name:', error)
    throw new Error('Nem sikerült ellenőrizni a profilnevet')
  }

  return data === true
}

/**
 * Register a profile with name and PIN in Supabase
 * Called after user is created locally
 */
export async function registerProfile(
  userId: string,
  profileName: string,
  pin: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isOnline()) {
    console.warn('[Recovery] Cannot register profile - offline or not configured')
    return false
  }

  const supabase = getSupabase()
  if (!supabase) return false

  const { data, error } = await supabase.rpc('register_profile', {
    p_user_id: userId,
    p_profile_name: profileName,
    p_pin: pin,
  })

  if (error) {
    console.error('[Recovery] Error registering profile:', error)
    throw new Error('Nem sikerült regisztrálni a profilt')
  }

  return data === true
}

/**
 * Verify recovery credentials and get user data
 * Returns null if not found or PIN incorrect
 */
export async function verifyRecovery(
  profileName: string,
  pin: string
): Promise<RecoveryResult | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Felhő szinkron nincs beállítva')
  }

  if (!isOnline()) {
    throw new Error('Nincs internetkapcsolat')
  }

  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Felhő kapcsolat nem elérhető')
  }

  const { data, error } = await supabase.rpc('verify_recovery', {
    p_profile_name: profileName,
    p_pin: pin,
  })

  if (error) {
    console.error('[Recovery] Error verifying recovery:', error)
    throw new Error('Hiba a profil ellenőrzése során')
  }

  // Returns array, take first match (should only be one due to unique constraint)
  if (!data || data.length === 0) {
    return null
  }

  return data[0] as RecoveryResult
}

/**
 * Restore user data from cloud to local database
 */
export async function restoreFromCloud(cloudUser: RecoveryResult): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Felhő kapcsolat nem elérhető')
  }

  // 1. Create local user with cloud UUID
  const localUser: User = {
    id: cloudUser.id,
    createdAt: new Date(cloudUser.created_at),
    currentWeightKg: cloudUser.current_weight_kg,
    gender: cloudUser.gender,
    birthYear: cloudUser.birth_year ?? undefined,
    splitType: (cloudUser.split_type as SplitType) || 'bro-split',
    trainingDays: (cloudUser.training_days as TrainingDays) || {},
    weightUpdatedAt: new Date(cloudUser.weight_updated_at),
    profileName: cloudUser.profile_name,
  }

  await db.users.add(localUser)
  console.info('[Recovery] Created local user from cloud')

  // 2. Restore weight history
  const { data: weightHistory, error: weightError } = await supabase
    .from('weight_history')
    .select('*')
    .eq('user_id', cloudUser.id)
    .order('recorded_at', { ascending: true })

  if (weightError) {
    console.error('[Recovery] Error fetching weight history:', weightError)
  } else if (weightHistory && weightHistory.length > 0) {
    for (const record of weightHistory) {
      await db.weightHistory.add({
        userId: cloudUser.id,
        weightKg: record.weight_kg,
        recordedAt: new Date(record.recorded_at),
      })
    }
    console.info(`[Recovery] Restored ${weightHistory.length} weight records`)
  }

  // 3. Restore sessions and set logs
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', cloudUser.id)
    .order('date', { ascending: true })

  if (sessionsError) {
    console.error('[Recovery] Error fetching sessions:', sessionsError)
  } else if (sessions && sessions.length > 0) {
    for (const session of sessions) {
      // Create local session
      const localSessionId = await db.sessions.add({
        userId: cloudUser.id,
        templateId: session.template_id,
        date: new Date(session.date),
        startedAt: new Date(session.started_at),
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
        notes: session.notes ?? undefined,
      })

      // Fetch and restore set logs for this session
      const { data: setLogs, error: setLogsError } = await supabase
        .from('set_logs')
        .select('*')
        .eq('session_id', session.id)
        .order('logged_at', { ascending: true })

      if (setLogsError) {
        console.error(`[Recovery] Error fetching set logs for session ${session.id}:`, setLogsError)
      } else if (setLogs && setLogs.length > 0) {
        for (const log of setLogs) {
          await db.setLogs.add({
            sessionId: localSessionId,
            exerciseId: log.exercise_id,
            setNumber: log.set_number,
            weightKg: log.weight_kg,
            addedWeightKg: log.added_weight_kg ?? undefined,
            reps: log.reps,
            rir: log.rir as 0 | 1 | 2 | 3 | 4,
            loggedAt: new Date(log.logged_at),
          })
        }
      }
    }
    console.info(`[Recovery] Restored ${sessions.length} sessions`)
  }

  // 4. Restore estimated maxes
  const { data: maxes, error: maxesError } = await supabase
    .from('estimated_maxes')
    .select('*')
    .eq('user_id', cloudUser.id)
    .order('calculated_at', { ascending: true })

  if (maxesError) {
    console.error('[Recovery] Error fetching estimated maxes:', maxesError)
  } else if (maxes && maxes.length > 0) {
    for (const max of maxes) {
      await db.estimatedMaxes.add({
        userId: cloudUser.id,
        exerciseId: max.exercise_id,
        estimated1RM: max.estimated_1rm,
        calculatedAt: new Date(max.calculated_at),
      })
    }
    console.info(`[Recovery] Restored ${maxes.length} estimated max records`)
  }

  // 5. Mark as migrated (already synced)
  setMigrated(true)
  console.info('[Recovery] Profile recovery complete!')
}

/**
 * Change recovery PIN (requires current PIN verification)
 */
export async function changeRecoveryPin(
  userId: string,
  currentPin: string,
  newPin: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isOnline()) {
    throw new Error('Nincs internetkapcsolat')
  }

  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Felhő kapcsolat nem elérhető')
  }

  const { data, error } = await supabase.rpc('change_recovery_pin', {
    p_user_id: userId,
    p_current_pin: currentPin,
    p_new_pin: newPin,
  })

  if (error) {
    console.error('[Recovery] Error changing PIN:', error)
    throw new Error('Hiba a PIN megváltoztatása során')
  }

  return data === true
}
