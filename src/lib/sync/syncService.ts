import { db, getUser } from '@/lib/db'
import { getSupabase, isOnline, isSupabaseConfigured } from './supabaseClient'
import type {
  SyncQueueItem,
  SyncTable,
  SyncAction,
  SyncState,
} from './types'

// Sync state for UI
let syncState: SyncState = {
  status: 'idle',
  pendingCount: 0,
  lastSyncAt: null,
  lastError: null,
  isMigrated: false,
}

// Listeners for sync state changes
type SyncStateListener = (state: SyncState) => void
const listeners: Set<SyncStateListener> = new Set()

export function subscribeSyncState(listener: SyncStateListener): () => void {
  listeners.add(listener)
  listener(syncState) // Immediately call with current state
  return () => listeners.delete(listener)
}

function updateSyncState(partial: Partial<SyncState>) {
  syncState = { ...syncState, ...partial }
  listeners.forEach((listener) => listener(syncState))
}

/**
 * Get current sync state
 */
export function getSyncState(): SyncState {
  return syncState
}

/**
 * Queue an item for sync to Supabase
 */
export async function queueSync(
  table: SyncTable,
  action: SyncAction,
  localId: number | string,
  data: Record<string, unknown>
): Promise<void> {
  // Only queue if Supabase is configured
  if (!isSupabaseConfigured()) return

  await db.syncQueue.add({
    table,
    action,
    localId,
    data,
    createdAt: new Date(),
    retryCount: 0,
  })

  // Update pending count
  const pendingCount = await db.syncQueue.where('syncedAt').equals(undefined as unknown as Date).count()
  updateSyncState({ pendingCount })

  // Trigger sync if online
  if (isOnline()) {
    processSyncQueue()
  }
}

/**
 * Process the sync queue - upload pending items to Supabase
 */
export async function processSyncQueue(): Promise<void> {
  const supabase = getSupabase()
  if (!supabase || !isOnline()) {
    updateSyncState({ status: isOnline() ? 'idle' : 'offline' })
    return
  }

  const user = await getUser()
  if (!user) return

  updateSyncState({ status: 'syncing', lastError: null })

  try {
    // Get pending items (not yet synced, ordered by creation time)
    const items = await db.syncQueue
      .filter((item) => !item.syncedAt && item.retryCount < 5)
      .sortBy('createdAt')

    if (items.length === 0) {
      updateSyncState({ status: 'idle', pendingCount: 0 })
      return
    }

    // Process items in order
    for (const item of items) {
      try {
        await syncItem(item, user.id)
        // Mark as synced
        await db.syncQueue.update(item.id!, { syncedAt: new Date() })
      } catch (error) {
        console.error(`[Sync] Failed to sync ${item.table}:${item.localId}`, error)
        // Increment retry count
        await db.syncQueue.update(item.id!, {
          retryCount: item.retryCount + 1,
          error: String(error),
        })
      }
    }

    // Clean up old synced items (keep last 100)
    const syncedItems = await db.syncQueue
      .filter((item) => !!item.syncedAt)
      .sortBy('syncedAt')

    if (syncedItems.length > 100) {
      const toDelete = syncedItems.slice(0, syncedItems.length - 100)
      await db.syncQueue.bulkDelete(toDelete.map((item) => item.id!))
    }

    // Update state
    const pendingCount = await db.syncQueue.filter((item) => !item.syncedAt).count()
    updateSyncState({
      status: 'idle',
      pendingCount,
      lastSyncAt: new Date(),
    })
  } catch (error) {
    console.error('[Sync] Queue processing failed', error)
    updateSyncState({
      status: 'error',
      lastError: String(error),
    })
  }
}

/**
 * Sync a single item to Supabase
 */
async function syncItem(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase not initialized')

  switch (item.table) {
    case 'users':
      await syncUser(item, userId)
      break
    case 'weight_history':
      await syncWeightHistory(item, userId)
      break
    case 'sessions':
      await syncSession(item, userId)
      break
    case 'set_logs':
      await syncSetLog(item, userId)
      break
    case 'estimated_maxes':
      await syncEstimatedMax(item, userId)
      break
    case 'ai_feedback':
      await syncAIFeedback(item, userId)
      break
    default:
      console.warn(`[Sync] Unknown table: ${item.table}`)
  }
}

async function syncUser(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()!
  const data = item.data

  if (item.action === 'insert') {
    const { error } = await supabase.from('users').upsert({
      id: userId,
      created_at: data.createdAt,
      current_weight_kg: data.currentWeightKg,
      gender: data.gender,
      birth_year: data.birthYear || null,
      training_days: data.trainingDays || {},
      weight_updated_at: data.weightUpdatedAt,
    })
    if (error) throw error
  } else if (item.action === 'update') {
    const { error } = await supabase
      .from('users')
      .update({
        current_weight_kg: data.currentWeightKg,
        training_days: data.trainingDays,
        weight_updated_at: data.weightUpdatedAt,
      })
      .eq('id', userId)
    if (error) throw error
  }
}

async function syncWeightHistory(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()!
  const data = item.data

  if (item.action === 'insert') {
    const { error } = await supabase.from('weight_history').insert({
      user_id: userId,
      weight_kg: data.weightKg,
      recorded_at: data.recordedAt,
    })
    if (error) throw error
  }
}

async function syncSession(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()!
  const data = item.data

  if (item.action === 'insert') {
    const { error } = await supabase.from('sessions').upsert({
      user_id: userId,
      template_id: data.templateId,
      date: data.date,
      started_at: data.startedAt,
      completed_at: data.completedAt || null,
      notes: data.notes || null,
      local_id: item.localId as number,
    }, {
      onConflict: 'user_id,local_id',
    })
    if (error) throw error
  } else if (item.action === 'update') {
    const { error } = await supabase
      .from('sessions')
      .update({
        completed_at: data.completedAt,
        notes: data.notes || null,
      })
      .eq('user_id', userId)
      .eq('local_id', item.localId)
    if (error) throw error
  }
}

async function syncSetLog(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()!
  const data = item.data

  if (item.action === 'insert') {
    // First, get the remote session ID
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('local_id', data.sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error(`Session not found for local_id ${data.sessionId}`)
    }

    const { error } = await supabase.from('set_logs').insert({
      session_id: session.id,
      exercise_id: data.exerciseId,
      set_number: data.setNumber,
      weight_kg: data.weightKg,
      added_weight_kg: data.addedWeightKg || null,
      reps: data.reps,
      rir: data.rir,
      logged_at: data.loggedAt,
      local_id: item.localId as number,
    })
    if (error) throw error
  }
}

async function syncEstimatedMax(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()!
  const data = item.data

  if (item.action === 'insert') {
    const { error } = await supabase.from('estimated_maxes').insert({
      user_id: userId,
      exercise_id: data.exerciseId,
      estimated_1rm: data.estimated1RM,
      calculated_at: data.calculatedAt,
      local_id: item.localId as number,
    })
    if (error) throw error
  }
}

async function syncAIFeedback(item: SyncQueueItem, userId: string): Promise<void> {
  const supabase = getSupabase()!
  const data = item.data

  if (item.action === 'insert') {
    const { error } = await supabase.from('ai_feedback').insert({
      user_id: userId,
      type: data.type,
      content: data.content,
      data_snapshot: data.dataSnapshot ? JSON.parse(data.dataSnapshot as string) : null,
      created_at: data.createdAt,
      local_id: item.localId as number,
    })
    if (error) throw error
  }
}

/**
 * Get count of pending sync items
 */
export async function getPendingSyncCount(): Promise<number> {
  return await db.syncQueue.filter((item) => !item.syncedAt).count()
}

/**
 * Clear all sync queue items (for debugging/reset)
 */
export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear()
  updateSyncState({ pendingCount: 0 })
}

/**
 * Mark user as migrated (initial data uploaded to Supabase)
 */
export function setMigrated(migrated: boolean): void {
  updateSyncState({ isMigrated: migrated })
  if (migrated) {
    localStorage.setItem('supabase_migrated', 'true')
  } else {
    localStorage.removeItem('supabase_migrated')
  }
}

/**
 * Check if user data has been migrated to Supabase
 */
export function isMigrated(): boolean {
  return localStorage.getItem('supabase_migrated') === 'true'
}

/**
 * Initialize sync state from localStorage
 */
export async function initSyncState(): Promise<void> {
  const migrated = isMigrated()
  const pendingCount = await getPendingSyncCount()

  updateSyncState({
    isMigrated: migrated,
    pendingCount,
    status: isOnline() ? 'idle' : 'offline',
  })
}
