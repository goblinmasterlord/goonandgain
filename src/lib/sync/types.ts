// Sync-related types

export type SyncTable =
  | 'users'
  | 'weight_history'
  | 'sessions'
  | 'set_logs'
  | 'estimated_maxes'
  | 'ai_feedback'

export type SyncAction = 'insert' | 'update' | 'delete'

export interface SyncQueueItem {
  id?: number
  table: SyncTable
  action: SyncAction
  localId: number | string
  data: Record<string, unknown>
  createdAt: Date
  syncedAt?: Date
  error?: string
  retryCount: number
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export interface SyncState {
  status: SyncStatus
  pendingCount: number
  lastSyncAt: Date | null
  lastError: string | null
  isMigrated: boolean
}

// Supabase table types (snake_case for PostgreSQL)
export interface SupabaseUser {
  id: string
  created_at: string
  current_weight_kg: number
  gender: 'male' | 'female'
  birth_year: number | null
  training_days: Record<string, string>
  weight_updated_at: string
  profile_name: string | null
  recovery_pin_hash: string | null
  split_type: string | null
  last_active_at: string | null
}

// Recovery verification result (from verify_recovery function)
export interface RecoveryResult {
  id: string
  created_at: string
  current_weight_kg: number
  gender: 'male' | 'female'
  birth_year: number | null
  training_days: Record<string, string>
  weight_updated_at: string
  split_type: string | null
  profile_name: string
  last_active_at: string | null
  session_count: number
  total_sets: number
}

export interface SupabaseWeightHistory {
  id?: number
  user_id: string
  weight_kg: number
  recorded_at: string
}

export interface SupabaseSession {
  id?: number
  user_id: string
  template_id: string
  date: string
  started_at: string
  completed_at: string | null
  notes: string | null
  local_id: number
}

export interface SupabaseSetLog {
  id?: number
  session_id: number
  exercise_id: string
  set_number: number
  weight_kg: number
  added_weight_kg: number | null
  reps: number
  rir: number
  logged_at: string
  local_id: number
}

export interface SupabaseEstimatedMax {
  id?: number
  user_id: string
  exercise_id: string
  estimated_1rm: number
  calculated_at: string
  local_id: number
}

export interface SupabaseAIFeedback {
  id?: number
  user_id: string
  type: 'post_workout' | 'weekly' | 'alert' | 'on_demand'
  content: string
  data_snapshot: Record<string, unknown> | null
  created_at: string
  local_id: number
}
