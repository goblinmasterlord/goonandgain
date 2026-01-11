// Supabase sync module exports

export {
  initSupabase,
  getSupabase,
  isSupabaseConfigured,
  isOnline,
} from './supabaseClient'

export {
  queueSync,
  processSyncQueue,
  getSyncState,
  subscribeSyncState,
  getPendingSyncCount,
  clearSyncQueue,
  setMigrated,
  isMigrated,
  initSyncState,
} from './syncService'

export {
  migrateLocalDataToSupabase,
  resetMigration,
} from './migration'

export {
  checkProfileNameAvailable,
  registerProfile,
  verifyRecovery,
  restoreFromCloud,
  changeRecoveryPin,
} from './recovery'

export type {
  SyncQueueItem,
  SyncTable,
  SyncAction,
  SyncState,
  SyncStatus,
  RecoveryResult,
} from './types'
