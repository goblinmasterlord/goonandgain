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

### 2. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql` - Initial tables
   - `supabase/migrations/002_profile_recovery.sql` - Profile recovery system (names, PINs)

Note: The profile recovery migration enables `pgcrypto` extension for bcrypt PIN hashing.

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
| `users` | User profile (weight, gender, training days, profile_name, recovery_pin_hash) |
| `weight_history` | Weight tracking history |
| `sessions` | Workout sessions |
| `set_logs` | Individual set records (weight, reps, RIR 0-4, is_max_attempt) |
| `estimated_maxes` | 1RM history per exercise |
| `ai_feedback` | AI coaching responses |

### Profile Recovery Fields (users table)

| Column | Type | Description |
|--------|------|-------------|
| `profile_name` | TEXT | Globally unique profile name (case-insensitive) |
| `recovery_pin_hash` | TEXT | bcrypt-hashed 4-digit PIN |
| `split_type` | TEXT | Training split type (bro-split, ppl) |
| `last_active_at` | TIMESTAMPTZ | Auto-updated when completing sessions |

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
├── types.ts           # Type definitions (SyncQueueItem, SyncState, RecoveryResult)
├── supabaseClient.ts  # Supabase client initialization
├── syncService.ts     # Sync queue management
├── migration.ts       # Local-to-cloud data migration
└── recovery.ts        # Profile recovery functions
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

// Profile Recovery Functions
checkProfileNameAvailable(name): Promise<boolean>
registerProfile(userId, profileName, pin): Promise<boolean>
verifyRecovery(profileName, pin): Promise<RecoveryResult | null>
restoreFromCloud(cloudUser): Promise<void>
changeRecoveryPin(userId, currentPin, newPin): Promise<boolean>
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

// Example: After editing a set
await db.setLogs.update(setId, updates)  // Update local
queueSync('set_logs', 'update', setId, updatedSet)  // Queue for cloud
```

The queue is stored in `syncQueue` table (Dexie) and processed in background.

### Supported Actions

| Action | Description |
|--------|-------------|
| `insert` | New record created |
| `update` | Existing record modified (e.g., editing a set) |
| `delete` | Record removed |

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

## Profile Recovery

GoonAndGain supports profile-based data recovery without full authentication.

### How It Works

1. During onboarding, users set a **profile name** (globally unique) and **4-digit PIN**
2. Profile name and hashed PIN are stored in Supabase
3. If user loses local data, they can recover via profile name + PIN

### Database Functions

The `002_profile_recovery.sql` migration creates these functions:

| Function | Description |
|----------|-------------|
| `check_profile_name_available(name)` | Returns true if name is not taken |
| `register_profile(user_id, name, pin)` | Stores profile with bcrypt-hashed PIN |
| `verify_recovery(name, pin)` | Verifies credentials, returns user data + stats |
| `change_recovery_pin(user_id, current, new)` | Changes PIN (requires current PIN) |

### Security Notes

- PINs are hashed using `pgcrypto` extension (bcrypt, cost 8)
- Plain text PIN is never stored
- Profile name uniqueness enforced by unique index on `LOWER(profile_name)`
- `last_active_at` is auto-updated via trigger when completing workouts

### Recovery Flow

1. User enters profile name + PIN on `/recovery` page
2. Client calls `verify_recovery()` RPC function
3. If match found → returns user profile + session count + total sets
4. User confirms → `restoreFromCloud()` fetches all data from Supabase
5. Data is written to local IndexedDB
6. User is redirected to home

---

## Future Enhancements

Not yet implemented:

- [ ] Multi-device sync (conflict resolution)
- [ ] User authentication (Supabase Auth)
- [ ] Real-time sync (Supabase Realtime)
- [ ] Data export to JSON/CSV
- [ ] Rate limiting for recovery attempts (Edge Function)

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
