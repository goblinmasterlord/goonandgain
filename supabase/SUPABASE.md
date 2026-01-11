# Supabase Cloud Sync

GoonAndGain uses Supabase as an optional cloud backup for user data. The app remains **local-first** - Dexie.js (IndexedDB) is the primary data store, with Supabase providing cloud backup and future multi-device sync capability.

## Architecture

```
[Local Device]                    [Supabase Cloud]
     │                                  │
  Dexie.js  ───background sync────►  PostgreSQL
  (Primary)                         (Backup)
     │                                  │
   Writes                            Writes
  instantly                       batched async
```

**Key Principles:**
- Dexie stays as source of truth (offline-first)
- Supabase stores a backup for data persistence
- App works 100% offline without Supabase configured
- Static data (exercises, templates) stays client-side only

---

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Wait for initialization (~2 minutes)

### 2. Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**

### 3. Get Credentials

1. Go to **Project Settings** → **API**
2. Copy **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy **Publishable key** (starts with `sb_publishable_...`)

### 4. Configure Environment

Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

---

## Database Schema

### Tables Synced to Supabase

| Table | Description |
|-------|-------------|
| `users` | User profile (weight, gender, training days) |
| `weight_history` | Weight tracking history |
| `sessions` | Workout sessions |
| `set_logs` | Individual set records |
| `estimated_maxes` | 1RM history per exercise |
| `ai_feedback` | AI coaching responses |

### Tables NOT Synced (Static Data)

| Table | Reason |
|-------|--------|
| `exercises` | Static reference data (~50 exercises) |
| `workoutTemplates` | Static template data |

---

## Code Structure

```
src/lib/sync/
├── index.ts           # Module exports
├── types.ts           # Type definitions (SyncQueueItem, SyncState)
├── supabaseClient.ts  # Supabase client initialization
├── syncService.ts     # Sync queue management
└── migration.ts       # Local-to-cloud data migration
```

### Key Functions

```typescript
// Check if Supabase is configured
isSupabaseConfigured(): boolean

// Queue an item for sync
queueSync(table, action, localId, data): Promise<void>

// Process the sync queue (called automatically)
processSyncQueue(): Promise<void>

// Migrate all local data to Supabase (one-time)
migrateLocalDataToSupabase(): Promise<MigrationResult>

// Subscribe to sync state changes (for UI)
subscribeSyncState(listener): () => void
```

### Sync State

```typescript
interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'offline'
  pendingCount: number
  lastSyncAt: Date | null
  lastError: string | null
  isMigrated: boolean
}
```

---

## How Sync Works

### Auto-Sync Triggers

1. **App startup** - Processes queue if online
2. **Coming back online** - Resumes sync when network returns
3. **After data changes** - Queues items for background sync

### Manual Sync

Users can tap "SZINKRON" button in Settings to force sync.

### Sync Queue

All writes go to Dexie first, then queue for Supabase:

```typescript
// Example: After logging a set
await db.setLogs.add(setLog)  // Instant local write
queueSync('set_logs', 'insert', setLog.id, setLog)  // Queue for cloud
```

The queue is stored in `syncQueue` table (Dexie) and processed in background.

---

## Data Migration

When a user first connects to Supabase, existing local data is migrated:

1. Check if user exists in Supabase
2. If not, upload all local data:
   - User profile
   - Weight history
   - All sessions with set logs
   - Estimated maxes
   - AI feedback
3. Mark as migrated (stored in localStorage)

Migration is triggered via "ADATOK FELTÖLTÉSE" button in Settings.

---

## Settings UI

The "Felhő szinkron" section in Settings shows:

- **Status**: Szinkronizálva / X függőben / Offline / Hiba
- **Last sync time**: When data was last synced
- **Migration button**: For first-time cloud upload
- **Sync button**: Manual sync trigger

---

## Free Tier Limits

Supabase free tier is generous:

| Resource | Limit | Our Usage |
|----------|-------|-----------|
| Database | 500 MB | ~30 KB/user/month |
| API Requests | 500K/month | Well within limits |
| Concurrent | 200 | Single user app |

**500 MB supports ~16,000+ users** - plenty for personal/small-scale use.

---

## Future Enhancements

Not yet implemented:

- [ ] Multi-device sync (conflict resolution)
- [ ] User authentication (Supabase Auth)
- [ ] Real-time sync (Supabase Realtime)
- [ ] Data export to JSON/CSV

---

## Troubleshooting

### "Nincs beállítva" in Settings
Supabase environment variables not set. Check `.env` file.

### Sync stuck on "Szinkronizálás..."
Check browser console for errors. May be network or auth issue.

### Migration fails
1. Ensure SQL migration was run in Supabase
2. Check that anon key is correct (publishable, not secret)
3. Verify project URL format: `https://xxxxx.supabase.co`

### Data not appearing in Supabase
1. Check `syncQueue` table in browser DevTools → Application → IndexedDB
2. Look for items with `error` field set
3. Items retry up to 5 times before giving up
