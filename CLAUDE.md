# CLAUDE.md - GoonAndGain Project Context

## Project Overview
GoonAndGain is a **Hungarian-language PWA gym planner** for intermediate lifters. It features local-first storage, AI coaching via Gemini, and progressive overload tracking.

**Key Documents:**
- [PRD.md](PRD.md) - Full product requirements (read this for feature details)
- [DESIGN.md](DESIGN.md) - Design philosophy (brutalist, industrial aesthetic)
- [supabase/SUPABASE.md](supabase/SUPABASE.md) - Cloud sync setup and architecture

---

## Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (brutalist design - NO rounded corners)
- **State:** Zustand (session state) + Dexie.js (IndexedDB)
- **Cloud Sync:** Supabase (optional - for cloud backup)
- **AI:** Gemini 3 Flash (`gemini-3-flash-preview`) - user provides API key
- **Animations:** Framer Motion
- **PWA:** vite-plugin-pwa
- **Deployment:** Vercel

---

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Base components (Button, Input, Card)
│   ├── layout/             # AppShell, BottomNav
│   ├── workout/            # SetLogger, RestTimer, ExerciseTransition, WorkoutSummary (DONE)
│   ├── dashboard/          # StrengthBenchmarks (DONE)
│   ├── ai/                 # PostWorkoutFeedback (DONE)
│   ├── pwa/                # OfflineIndicator, InstallPrompt, UpdatePrompt (DONE)
│   └── weight/             # WeightCheckInPrompt (DONE)
├── pages/
│   ├── Onboarding/         # Welcome, PersonalData, ProfileSetup, ProgramSelect, TrainingSetup, Ready
│   ├── Recovery/           # Profile recovery from cloud (DONE)
│   ├── Home/               # Today's workout overview
│   ├── Workout/            # Active session with SetLogger (DONE)
│   ├── Exercises/          # Exercise library + detail page (DONE)
│   ├── Progress/           # Volume Dashboard with weekly tracking (DONE)
│   ├── History/            # Past sessions with detail modal (DONE)
│   ├── Coach/              # Coach Bebi AI chat (DONE)
│   └── Settings/           # User settings (DONE)
├── lib/
│   ├── db/                 # Dexie database (schema + session/set helpers)
│   ├── sync/               # Supabase cloud sync + profile recovery (DONE)
│   ├── ai/                 # Coach Bebi integration (DONE)
│   ├── workout/            # Progressive overload engine (DONE)
│   └── utils/              # cn() helper for classnames
├── hooks/                  # Custom hooks (TODO)
├── stores/                 # Zustand stores (workoutStore.ts - DONE)
├── data/                   # Static data (exercises, templates)
├── i18n/                   # Hungarian translations (TODO)
├── styles/                 # globals.css with Tailwind
└── types/                  # TypeScript interfaces (index.ts)
```

---

## Design System

### Aesthetic: Industrial Brutalist
- **NO rounded corners** - all elements have sharp edges
- **Grain texture** overlay on body
- **Harsh shadows** (`shadow-harsh`, `shadow-harsh-lg`)
- **Uppercase labels** with wide letter-spacing
- **Monospace numbers** for data display

### Fonts
- **Display:** Syne (bold, geometric) - headings, labels
- **Body:** Outfit - paragraphs, descriptions
- **Mono:** JetBrains Mono - numbers, data, inputs

### Colors (defined in tailwind.config.ts)
```
bg-primary: #050505      (main background)
bg-secondary: #0d0d0d    (cards)
bg-elevated: #171717     (inputs, elevated)
accent: #ff4d00          (primary orange)
text-primary: #f0f0f0
text-secondary: #8a8a8a
text-muted: #4a4a4a

Muscle colors:
- chest: #ff4d00 (orange)
- back: #0066ff (blue)
- shoulders: #9333ea (purple)
- arms: #ff0066 (pink)
- legs: #00d4aa (teal)
- push: #f97316 (orange, PPL)
- pull: #22d3ee (cyan, PPL)
```

### Key CSS Classes (in globals.css)
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- `.card`, `.card-accent`, `.card-harsh`
- `.input`, `.input-mono`
- `.label` - uppercase small labels
- `.section-header`, `.section-title`
- `.stat-block`, `.stat-value`, `.stat-label`
- `.progress-bar`, `.progress-fill`
- `.glow-accent`, `.shadow-harsh`
- `.bg-grid` - subtle grid pattern

---

## Database Schema (Dexie/IndexedDB)

Defined in `src/lib/db/index.ts`:

```typescript
users: 'id, createdAt'
weightHistory: '++id, odbc, recordedAt'
exercises: 'id, muscleGroupPrimary, equipment, type'
workoutTemplates: 'id, muscleFocus'
sessions: '++id, odbc, templateId, date, startedAt'
setLogs: '++id, sessionId, exerciseId, loggedAt'
aiFeedback: '++id, odbc, type, createdAt'
estimatedMaxes: '++id, odbc, exerciseId, calculatedAt'
```

Types are in `src/types/index.ts`.

---

## Adding Exercise Data

Exercises are defined in `src/data/exercises.ts`. Each exercise needs:

```typescript
{
  id: string,                    // unique slug (e.g., 'flat-barbell-bench')
  nameHu: string,                // Hungarian name
  nameEn: string,                // English name (for reference)
  muscleGroupPrimary: MuscleGroup,
  muscleGroupsSecondary: MuscleGroup[],
  type: 'compound' | 'isolation',
  equipment: Equipment,
  defaultRepRangeMin: number,
  defaultRepRangeMax: number,
  instructionsHu: string[],      // Form cues in Hungarian
  mistakesToAvoidHu: string[],   // Common mistakes in Hungarian
  alternativeExerciseIds: string[],
  isBodyweight: boolean,
}
```

**MuscleGroup options:** chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core, forearms, traps, rear_delts, front_delts, side_delts

**Equipment options:** barbell, dumbbell, cable, machine, bodyweight, kettlebell, ez_bar

---

## Adding Workout Templates

Templates are defined in `src/data/templates.ts`. Each template needs:

```typescript
{
  id: string,                    // e.g., 'chest-day'
  nameHu: string,                // e.g., 'Mellnap'
  nameEn: string,
  muscleFocus: WorkoutType,      // chest, back, shoulders, arms, legs, push, pull, flex
  exercises: [
    {
      exerciseId: string,        // must match an exercise.id
      order: number,
      targetSets: number,
      targetRepMin: number,
      targetRepMax: number,
      restSeconds: number,
    }
  ]
}
```

---

## Hungarian Language Notes

All UI text must be in Hungarian. Key translations:
- Sets = Sorozatok
- Reps = Ismétlések
- Weight = Súly
- Rest = Pihenő
- Start Workout = Edzés indítása
- Log Set = Sorozat rögzítése

See PRD.md Appendix A for full translation reference.

---

## Current Implementation Status

### Completed (Phase 1-2)
- [x] Project setup (Vite, Tailwind, TypeScript)
- [x] Brutalist design system (squared edges, grain, harsh shadows)
- [x] Database schema (Dexie) with session/set helpers
- [x] Base UI components (Button, Input, Card)
- [x] Layout (AppShell, BottomNav)
- [x] Routing structure
- [x] Onboarding flow (5 screens: Personal → Profile → Program → Training → Ready)
- [x] Home page with template integration
- [x] Exercise data (chest day - 8 exercises)
- [x] Workout templates (chest day template)
- [x] Exercise library page with search/filtering
- [x] Exercise detail page with instructions
- [x] Zustand workout store (workoutStore.ts)
- [x] Set Logger component (weight, reps, RIR input)
- [x] Rest Timer component with countdown
- [x] Workout flow (start → log sets → complete)
- [x] Exercise swap functionality

### Completed (Phase 3)
- [x] History page with session list and detail modal
- [x] Volume Dashboard (Progress page) with weekly tracking
- [x] Week selector navigation for volume data
- [x] Volume guidelines per muscle group (from PRD)
- [x] Color-coded volume status (low/optimal/high)
- [x] Progressive Overload Engine with smart weight suggestions
- [x] 1RM estimation using Brzycki formula
- [x] Estimated max tracking in database
- [x] Strength Benchmarks with bodyweight ratios
- [x] StrengthBenchmarks component on Progress page
- [x] Coach Bebi AI integration (Gemini 3 Flash)
- [x] Coach page with chat interface
- [x] Post-workout feedback component
- [x] Weekly review feature
- [x] All exercise data (chest, back, shoulders, arms, legs)

### Completed (Phase 4)
- [x] PWA + Offline support
- [x] Settings page with profile management
- [x] Weight check-in reminders
- [x] Exercise Transition screen with Coach Bebi messages
- [x] Workout Summary screen with performance analysis
- [x] Coach Bebi personality update (aggressive/funny/roasting)

### Completed (Phase 5)
- [x] PPL (Push/Pull/Legs) training split mode
- [x] Split type selection in onboarding (ProgramSelect screen)
- [x] 6 PPL templates with A/B variations for 2x weekly frequency
- [x] Split changer in Settings page
- [x] Workout preview screen before starting workout
- [x] Workout overview modal during active session
- [x] Exercise info access from workout overview
- [x] Viewport-aware InfoTooltip component
- [x] Improved input placeholder styling

### Completed (Phase 6)
- [x] Supabase cloud sync infrastructure
- [x] Sync queue with background processing
- [x] Data migration from local to cloud
- [x] Cloud sync UI in Settings page
- [x] Online/offline status handling

### Completed (Phase 7) - Smart Progression & Set Editing
- [x] RIR 0 option for true failure (couldn't do another rep)
- [x] Max attempt detection (heavy singles auto-excluded from progression)
- [x] Working set-based progression (uses median of working sets, not final set)
- [x] Set editing in History page (tap any set to edit weight/reps/RIR)
- [x] Mark sets as "Max kísérlet" retroactively
- [x] Supabase sync support for set updates

### Completed (Phase 8) - Profile Recovery System
- [x] Profile naming during onboarding (new ProfileSetup screen)
- [x] 4-digit PIN for recovery verification
- [x] Globally unique profile names (case-insensitive, Supabase enforced)
- [x] Recovery page accessible from Welcome screen ("Van már profilom")
- [x] PIN change functionality in Settings
- [x] Supabase functions for secure PIN hashing (bcrypt via pgcrypto)
- [x] Migration 002_profile_recovery.sql

### Completed (Phase 9) - Coach Avatar Selection
- [x] CoachAvatar type (`'bebi' | 'marci'`) in User interface
- [x] Avatar utility module (`src/lib/utils/avatar.ts`)
- [x] Avatar selector UI in Settings ("Edzés avatar" section)
- [x] WorkoutSummary uses selected avatar
- [x] ExerciseTransition uses selected avatar
- [x] Coach Bebi chat unchanged (only workout screens use selected avatar)

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Important Files to Read First

1. `PRD.md` - Understand all features
2. `src/types/index.ts` - All TypeScript interfaces
3. `src/lib/db/index.ts` - Database schema + helper functions
4. `src/stores/workoutStore.ts` - Zustand store for active workout
5. `tailwind.config.ts` - Design tokens
6. `src/styles/globals.css` - CSS component classes
7. `src/data/exercises.ts` - Exercise data structure
8. `src/data/templates.ts` - Workout template structure

---

## Training Splits

The app supports two training split modes, selectable during onboarding or in Settings.

### Bro Split (5-day)
Traditional bodybuilding split hitting each muscle group once per week:
- Chest Day, Back Day, Shoulders Day, Arms Day, Legs Day, Flex Day

### PPL - Push/Pull/Legs (6-day)
Modern split with 2x weekly muscle frequency for optimal hypertrophy:
- **Push A** (Chest focus): Bench, incline, flys, shoulders, triceps
- **Pull A** (Row focus): Rows, pulldowns, rear delts, biceps
- **Legs A** (Squat focus): Squats, RDL, leg press, extensions, curls
- **Push B** (Shoulder focus): OHP, incline, bench, laterals, triceps
- **Pull B** (Deadlift focus): Deadlift, rows, pulldowns, rear delts, biceps
- **Legs B** (Hamstring focus): RDL, hack squat, split squats, curls

Templates are ordered chronologically for weekly rotation: Push A → Pull A → Legs A → Push B → Pull B → Legs B

### Split Type Configuration
- `SplitType`: `'bro-split' | 'ppl'` stored in user profile
- Templates filtered by `splitType` on Home page
- Changeable in Settings with confirmation modal

---

## Workout Flow

The workout flow is managed by the `workoutStore` (Zustand):

1. **Select Workout** - User taps a template card on Home page
   - Navigates to `/workout?template=push-day-a`
   - Shows WorkoutPreview screen with exercise list, stats, duration

2. **Start Workout** - User clicks "EDZÉS INDÍTÁSA" on preview screen
   - Creates a new session in IndexedDB via `createSession(templateId)`
   - Loads the template and first exercise's last session data

3. **Log Sets** - For each exercise:
   - User enters weight, reps, and RIR (1-4)
   - Clicks "SOROZAT RÖGZÍTÉSE"
   - Set is saved to IndexedDB via `logSet()`
   - Rest timer starts automatically (based on exercise.restSeconds)
   - Advances to next set or next exercise

4. **View Workout Overview** - During workout:
   - Tap template name in header (e.g., "Push A - 2/6")
   - Opens WorkoutOverviewModal with full exercise list
   - Shows completed/current/pending status per exercise
   - Each exercise has info button linking to exercise details

5. **Swap Exercise** - User can swap current exercise for an alternative
   - Opens modal with alternative exercises
   - Updates the template in-memory (not persisted)

6. **Skip Set** - User can skip the current set
   - Shows toast notification: "{N}. sorozat kihagyva" (red, 2 seconds)
   - Advances to next set or triggers transition screen
   - Toast uses Framer Motion animation (slide up, scale)

7. **End Workout** - User clicks "Befejezés"
   - Session is marked complete via `completeSession(sessionId)`
   - User is returned to Home page

### Key Store State:
```typescript
sessionId: number | null
template: WorkoutTemplate | null
currentExerciseIndex: number
currentSetNumber: number
completedSets: SetLog[]
lastSessionSets: SetLog[]  // For showing previous performance
isResting: boolean
restTimeRemaining: number
```

### Database Helpers (src/lib/db/index.ts):
- `createSession(templateId)` - Start new workout session
- `completeSession(sessionId)` - Mark session complete
- `logSet(...)` - Save a single set
- `getSetLogsForSession(sessionId)` - Get all sets for session
- `getLastSetLogsForExercise(exerciseId)` - Get previous session's sets
- `getRecentSessionSummaries(limit)` - Get session list with set/exercise counts
- `getSessionWithSets(sessionId)` - Get session with all its set logs
- `getSetsInDateRange(start, end)` - Get all sets within date range (for volume)
- `getWeekStart(date)` - Get Monday of the week (for week navigation)

---

## Workout Transition Screens

The app shows Coach Bebi-style transition screens between exercises and at workout completion. Both screens use `z-[60]` to render above the BottomNav (z-50).

### Exercise Transition (`src/components/workout/ExerciseTransition.tsx`)

Shows after completing all sets of an exercise, before moving to the next one.

**Message Categories:**
```typescript
const COMPLETION_MESSAGES = {
  excellent: [...],  // Good performance (RIR 1-2)
  tooEasy: [...],    // Too easy (RIR 3-4)
  earlyFinish: [...] // Skipped sets early
}
```

**Features:**
- Full-screen overlay with `z-[60]` (above BottomNav)
- Coach Bebi avatar image (`/bebi-avatar.png`)
- 4-column stats grid: sets, reps, total kg, top set weight
- Fun fact card (e.g., "több mint egy tonna!")
- Next exercise preview with muscle color indicator
- Background scroll prevention
- "TOVÁBB 💪" button to proceed

**Store State:**
```typescript
showExerciseTransition: boolean
transitionData: {
  completedExerciseId: string
  completedExerciseSets: SetLog[]
  nextExerciseId: string | null
  wasEarlyFinish: boolean  // true if skipped sets
} | null
```

### Workout Summary (`src/components/workout/WorkoutSummary.tsx`)

Shows after completing the last exercise (workout complete).

**Message Categories:**
```typescript
const WORKOUT_MESSAGES = {
  beast: [...],   // Great workout (90%+ completion, low RIR)
  good: [...],    // Solid effort (75%+ completion)
  meh: [...],     // Too easy or some skips
  short: [...]    // Many skipped sets (<50% completion)
}
```

**Analysis Logic:**
```typescript
function analyzeWorkout(completedSets, totalExpectedSets) {
  const completionRate = completedSets.length / totalExpectedSets
  if (completionRate < 0.5) return 'short'
  if (completionRate < 0.75) return 'meh'
  const avgRir = ...
  if (avgRir >= 3) return 'meh'
  if (avgRir <= 2 && completionRate >= 0.9) return 'beast'
  return 'good'
}
```

**Features:**
- Full-screen overlay with `z-[60]` (above BottomNav)
- Coach Bebi avatar image
- 4-column stats grid (sets, duration, reps, total kg)
- Fun facts generator based on workout data:
  - Weight comparisons (tonna, autó, motor)
  - Rep counts
  - Duration achievements
  - Efficiency metrics
- Scrollable exercise breakdown list
- Color-coded completion status per exercise
- "BEFEJEZÉS 🔥" button to finish

**Store Actions:**
- `dismissExerciseTransition()` - Advance to next exercise
- `dismissWorkoutSummary()` - Complete and exit workout

### Coach Avatar System

Users can select their preferred coach avatar in Settings. The selected avatar appears on workout transition and summary screens.

**Available Coaches:**
- `bebi` - Coach Bebi (default)
- `marci` - Coach Marci

**Avatar Moods:**
- `proud` - Excellent performance
- `default` - Good/normal workout
- `disappointed` - Too easy (high RIR)
- `angry` - Skipped sets or short workout

**Avatar Images in `/public/`:**

| Coach | Proud | Default | Disappointed | Angry |
|-------|-------|---------|--------------|-------|
| Bebi | `bebi-proud.png` | `bebi-avatar.png` | `bebi-disappointed.png` | `bebi-angry.png` |
| Marci | `marci-proud.png` | `marci-avatar.png` | `marci-disappointed.png` | `marci-angry.png` |

**Key Functions (`src/lib/utils/avatar.ts`):**
- `getAvatarPath(coach, mood)` - Returns image path for coach/mood combination
- `COACH_NAMES` - Display names (Coach Bebi, Coach Marci)
- `getAvailableCoaches()` - Returns list of available coach options

**Usage in Components:**
```typescript
import { getAvatarPath, type AvatarMood } from '@/lib/utils/avatar'

// Get avatar based on user preference and performance
const mood: AvatarMood = getCategoryMood(performanceCategory)
const avatarSrc = getAvatarPath(user.coachAvatar ?? 'bebi', mood)
```

Note: Coach Bebi remains the AI chat coach - only the visual avatar on workout screens is affected by this setting.

### Layout Structure

Both screens use this pattern to ensure button visibility:
```tsx
<div className="fixed inset-0 z-[60] flex flex-col">
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto overscroll-contain">
    {/* Stats, message, etc. */}
  </div>

  {/* Fixed button at bottom */}
  <div className="flex-shrink-0 px-4 pt-3 pb-6 bg-bg-secondary">
    <Button>...</Button>
  </div>
</div>
```

Key considerations:
- `z-[60]` ensures overlay is above BottomNav (z-50)
- `flex-col` with `flex-1` for scrollable content area
- `flex-shrink-0` keeps button section fixed at bottom
- `pb-6` provides enough padding above where BottomNav would be

---

## History Page

The History page (`src/pages/History/index.tsx`) displays past workout sessions:

1. **Session List** - Shows all completed sessions with:
   - Template name and muscle color indicator
   - Date (Hungarian format) and relative time
   - Total sets and exercise count
   - Duration in minutes

2. **Session Detail Modal** - Opens when tapping a session:
   - Full-screen overlay with back navigation
   - Stats grid (sets, exercises, duration)
   - Sets grouped by exercise with weight, reps, RIR
   - Muscle color coding per exercise

---

## Volume Dashboard (Progress Page)

The Progress page (`src/pages/Progress/index.tsx`) tracks weekly training volume:

### Week Navigation
- Navigate between weeks with arrow buttons
- Current week shows "Ez a hét" (This week)
- Hungarian date format for date range

### Volume Guidelines (from PRD)
```typescript
VOLUME_GUIDELINES = {
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
```

### Volume Status Colors
- **Warning (yellow)** - Below minimum sets
- **Success (green)** - Within optimal range
- **Danger (red)** - Above maximum sets

### Features
- Weekly stats (total sets, avg RIR)
- Progress bars per muscle group
- Optimal range indicator on progress bars
- Dynamic tips based on volume analysis

---

## Progressive Overload Engine

The overload engine (`src/lib/workout/overload.ts`) calculates smart weight suggestions.

### Smart Working Set Detection

The algorithm now separates **working sets** from **max attempts**:

```typescript
// A set is detected as a max attempt if:
// 1. Explicitly marked with isMaxAttempt: true
// 2. OR: has 1-3 reps AND weight is 15%+ above median of all sets

// Example: 70kg×8, 70kg×8, 70kg×8, 85kg×1
// The 85kg×1 is detected as max attempt (21% above median, only 1 rep)
// Progression is based on the 70kg working sets, not the 85kg max attempt
```

### Algorithm (Enhanced)
```typescript
// Based on WORKING SETS (excludes max attempts):
if (rir === 0) → Reduce 5% ("True failure - unsustainable")
if (rir <= 1) → Maintain weight ("Near your max")
if (rir == 2 && reps >= max_rep_range) → +2.5kg compound / +1.25kg isolation ("Progress!")
if (rir >= 3) → +5kg compound / +2.5kg isolation ("Too easy")
if (reps < min_rep_range) → -10% weight ("Reduce for form")
```

### RIR Scale
| RIR | Meaning | Hungarian |
|-----|---------|-----------|
| **0** | True failure - couldn't do another rep | Kimerülés |
| **1** | Could do 1 more rep | Majdnem max |
| **2** | Ideal training intensity | Ideális |
| **3** | Too easy | Könnyű |
| **4+** | Way too easy | Túl könnyű |

### 1RM Calculation (Brzycki Formula)
```typescript
1RM = weight × (36 / (37 - reps))
```

### Key Functions
- `calculate1RM(weight, reps)` - Estimate 1 rep max
- `roundToIncrement(weight, increment)` - Round to nearest 2.5kg
- `isMaxAttemptSet(set, allSets)` - Detect if set is a heavy single/max attempt
- `analyzeLastSession(sets)` - Get analysis from previous session (separates working sets from max attempts)
- `calculateOverloadSuggestion(exercise, lastSets, repMin, repMax)` - Get suggestion based on working sets
- `formatLastSessionDisplay(sets)` - Format for display (shows max attempt 1RM if present)

### Analysis Data Structure
```typescript
interface LastSessionAnalysis {
  // Working sets (used for progression)
  workingSetWeight: number  // Median weight
  workingSetReps: number    // Median reps
  workingSetRir: number     // Median RIR
  workingSetsCount: number

  // Max attempt tracking
  hasMaxAttempt: boolean
  maxAttempt1RM: number | null

  // Legacy/display fields
  avgWeight, avgReps, avgRir, totalSets, estimated1RM
}
```

### Suggestion Types
- `progress` - Ready to add weight (green)
- `maintain` - Hold current weight (accent)
- `easy` - Weight was too light (yellow)
- `reduce` - Failed to hit rep target OR RIR 0 (red)

### Database Helpers
- `saveEstimatedMax(exerciseId, estimated1RM)` - Save new 1RM
- `getLatestEstimatedMax(exerciseId)` - Get most recent 1RM
- `getEstimatedMaxHistory(exerciseId, limit)` - Get 1RM history

---

## Set Editing

Users can edit any logged set from the History page.

### How to Edit
1. Go to **Előzmények** (History) tab
2. Tap on a session to view details
3. Tap any set row to open the edit modal
4. Modify weight, reps, RIR, or mark as max attempt
5. Tap **MENTÉS** to save

### SetEditModal Component (`src/components/workout/SetEditModal.tsx`)
- Full-screen modal with brutalist design
- Weight input with quick adjust buttons (±2.5, ±5)
- RIR selector (0-4) with color coding
- "Max kísérlet" toggle checkbox
- Changes synced to Supabase automatically

### Database Functions
- `updateSetLog(id, updates)` - Update set in IndexedDB
- `getSetLogById(id)` - Retrieve set for sync
- `queueSync('set_logs', 'update', ...)` - Queue for Supabase sync

---

## Strength Benchmarks

The strength benchmarks feature (`src/lib/workout/strength.ts`) compares user's lifts to bodyweight standards.

### Tracked Lifts
- **Guggolás (Squat)** - `barbell-back-squat`
- **Fekvenyomás (Bench)** - `flat-barbell-bench-press`
- **Felhúzás (Deadlift)** - `deadlift`
- **Vállból nyomás (OHP)** - `overhead-press-barbell`

### Strength Standards (Bodyweight Multipliers)
| Level | Squat | Bench | Deadlift | OHP |
|-------|-------|-------|----------|-----|
| Beginner | 1.0x | 0.75x | 1.25x | 0.5x |
| Intermediate | 1.5x | 1.2x | 2.0x | 0.8x |
| Advanced | 2.0x | 1.5x | 2.5x | 1.0x |
| Elite | 2.5x | 1.8x | 3.0x | 1.2x |

### Key Functions
- `calculateBWRatio(weight1RM, bodyweight)` - Calculate BW multiplier
- `getStrengthLevel(liftKey, bwRatio)` - Determine current level
- `calculateBenchmark(liftKey, estimated1RM, bodyweight)` - Full benchmark data
- `getLevelColor(level)` - Get color for level badge

### Level Colors
- **Beginner** - Accent orange (#ff4d00)
- **Intermediate** - Teal (#00d4aa)
- **Advanced** - Purple (#9333ea)
- **Elite** - Gold (#ffd700)

---

## Coach Bebi (AI Coach)

Coach Bebi is the AI coach powered by **Gemini 3 Flash** (`src/lib/ai/coach.ts`).

### Model
- **Model:** Gemini 3 Flash (`gemini-3-flash-preview`)
- **Why:** Google's most balanced model - optimized for speed, scale, and frontier intelligence
- **Docs:** https://ai.google.dev/gemini-api/docs/models#gemini-3-flash

### Features
- **Post-workout feedback** - 2-3 sentence summary after completing a workout
- **Weekly review** - Deep analysis with volume, progression, and recommendations
- **On-demand chat** - Ask questions about training, nutrition, etc.

### API Key
- User provides their Gemini API key (stored in localStorage)
- Get key from: https://aistudio.google.com/apikey

### Key Functions (`src/lib/ai/coach.ts`)
- `getPostWorkoutFeedback(sessionId)` - Get AI summary of workout
- `getWeeklyReview()` - Get weekly volume and progression analysis
- `askCoachBebi(question)` - Ask any training question
- `hasGeminiApiKey()` - Check if API key is configured
- `saveGeminiApiKey(key)` - Save API key to localStorage

### Prompt Templates (`src/lib/ai/prompts.ts`)
- System prompt defines Coach Bebi's personality:
  - Aggressive but funny (like a strict but lovable coach)
  - Uses CAPS LOCK sometimes for emphasis
  - Roasts users in a motivating way
  - Mix of Hungarian and gym bro slang
  - Examples: "Ez a súly? A nagymamám is többet emel!", "RIR 4? Akkor minek jöttél be, pihenni?"
- Context includes user profile, strength levels, weekly volume
- Each function builds specific prompts for different use cases

### Coach Page (`src/pages/Coach/index.tsx`)
- Chat interface with message history
- Quick action buttons (weekly review, practice tips, progression)
- API key setup screen if not configured
- Navigation via "BEBI" tab in bottom nav

### Post-workout Component (`src/components/ai/PostWorkoutFeedback.tsx`)
- Modal shown after completing workout
- Loading state with animated dots
- Error handling for missing API key

---

## PWA + Offline Support

The app is a full Progressive Web App with offline capabilities.

### Configuration (`vite.config.ts`)
- Uses `vite-plugin-pwa` with Workbox
- Runtime caching for Google Fonts
- Navigate fallback to index.html
- Auto-update with user prompt

### Components (`src/components/pwa/`)
- **OfflineIndicator** - Yellow banner when device is offline
- **InstallPrompt** - Add-to-home-screen prompt (after 30s delay)
- **UpdatePrompt** - Service worker update notification with refresh button

### Type Declarations (`src/vite-env.d.ts`)
Custom type declarations for `virtual:pwa-register/react` module.

---

## Settings Page

The Settings page (`src/pages/Settings/index.tsx`) manages user profile and app settings.

### Sections
1. **Személyes adatok (Personal Data)**
   - Weight editing with history tracking (saves to `weightHistory` table)
   - Gender display (read-only)
   - Training days count
   - Profile name display (if set)
   - Recovery PIN management (change PIN)

2. **Edzésprogram (Training Program)**
   - Split type selector (Bro Split / PPL)
   - Confirmation modal on change

3. **Edzés avatar (Coach Avatar)**
   - Visual avatar selector (Coach Bebi / Coach Marci)
   - Shows avatar preview images
   - Affects transition and summary screens only (not Coach chat)

4. **Felhő szinkron (Cloud Sync)** - If Supabase configured
   - Sync status display
   - Manual sync button
   - Data migration button (first-time upload)

5. **Coach Bebi**
   - Gemini API key management (add/remove)
   - Key stored in localStorage

6. **Alkalmazás (App)**
   - Version display (5-tap easter egg to Dev page)
   - About text

### Features
- Inline editing pattern (expand/collapse)
- Weight changes logged to database history
- Masked API key display ("••••••••••••")
- PIN change modal with current/new/confirm inputs

---

## Weight Check-in Reminders

Prompts users to update their weight if not updated in 7+ days.

### Component (`src/components/weight/WeightCheckInPrompt.tsx`)
- Checks `weightUpdatedAt` field in user record
- Shows floating prompt above bottom nav
- Two quick options: "UGYANANNYI" (same weight) or "VÁLTOZOTT" (changed)
- Dismissable for 24 hours (stored in localStorage)

### Behavior
- Only updates `weightUpdatedAt` if user confirms same weight
- Logs new weight to `weightHistory` table if changed
- Automatically hides after user action

---

## Mobile Safari Compatibility

### UUID Generation
**Do NOT use `crypto.randomUUID()` directly** - it's not available in older iOS Safari (pre-15.4) or non-secure contexts. Use the `generateUUID()` helper in `src/pages/Onboarding/Ready.tsx` which provides fallbacks:
1. `crypto.randomUUID()` - Modern browsers
2. `crypto.getRandomValues()` - Wider support fallback
3. `Math.random()` - Last resort

### Safari Address Bar
The bottom navigation uses `pb-safe` class (in `globals.css`) and the app uses `100dvh` (dynamic viewport height) to account for Safari's collapsing address bar. Key files:
- `src/styles/globals.css` - `.pb-safe` class definition
- `src/components/layout/AppShell.tsx` - Uses `min-h-dvh` and `pb-24`
- `src/components/layout/BottomNav.tsx` - Uses `pb-safe` for padding
- `tailwind.config.ts` - Defines `minHeight.dvh: '100dvh'`

---

## Routing & Auth Architecture

The app uses React Router with route guards and context for auth state (`src/App.tsx`):

### Key Components
- **AuthContext** - Shares `needsOnboarding`, `isLoading`, `recheckUser` with route guards
- **RequireUser** - Route guard that redirects to `/onboarding` if no user exists
- **RequireOnboarding** - Route guard that redirects to `/` if user already exists

### Router Creation
**IMPORTANT:** The router is created ONCE outside the App component to prevent re-creation on state changes. Route guards read from context to handle conditional rendering.

### Onboarding Flow (5 steps)
The onboarding flow now includes profile setup for cloud recovery:

1. **Welcome** (`/onboarding`) - App intro, "Van már profilom" recovery link
2. **Personal Data** (`/onboarding/personal`) - Weight, gender, age
3. **Profile Setup** (`/onboarding/profile`) - Profile name + 4-digit PIN (optional if offline)
4. **Program Select** (`/onboarding/program`) - Bro Split or PPL
5. **Training Setup** (`/onboarding/training`) - Weekly schedule
6. **Ready** (`/onboarding/ready`) - Confirmation, saves to IndexedDB + Supabase

When onboarding completes (`Ready.tsx`):
1. User is saved to IndexedDB
2. If Supabase configured + online + has profile name/PIN:
   - Migrate user data to Supabase
   - Register profile with hashed PIN
3. `onboarding-complete` custom event is dispatched
4. App component listens and calls `recheckUser()`
5. Route guards re-evaluate and redirect to home

---

## Profile Recovery System

Allows users to recover their data on a new device or after losing local storage.

### How It Works

1. **During Onboarding** - User sets a globally unique profile name + 4-digit PIN
2. **Cloud Storage** - Profile name and hashed PIN stored in Supabase
3. **Recovery** - User enters profile name + PIN to restore data

### Recovery Flow (`/recovery`)

Entry point: "Van már profilom" link on Welcome page

**Steps:**
1. Enter profile name and PIN
2. System verifies credentials via `verify_recovery()` Supabase function
3. If match found → shows profile summary (session count, total sets, dates)
4. User confirms → data restored locally from cloud
5. Navigate to home

**Error states:**
- "Nem található ilyen profil" (no match)
- "Hibás PIN" (wrong PIN)
- "Nincs internetkapcsolat" (offline)

### Security

- PIN is hashed server-side using `pgcrypto` (bcrypt, cost 8)
- PIN never stored locally or in plain text after initial registration
- Profile name uniqueness enforced by database constraint (case-insensitive)
- No rate limiting in v1 (consider adding Edge Function later)

### Key Files

- `src/lib/sync/recovery.ts` - Recovery functions
- `src/pages/Recovery/index.tsx` - Recovery page UI
- `src/pages/Onboarding/ProfileSetup.tsx` - Profile setup during onboarding
- `supabase/migrations/002_profile_recovery.sql` - Database functions

### Recovery Functions (`src/lib/sync/recovery.ts`)

```typescript
// Check if profile name is available
checkProfileNameAvailable(name: string): Promise<boolean>

// Register profile with hashed PIN
registerProfile(userId: string, profileName: string, pin: string): Promise<boolean>

// Verify credentials and get user data
verifyRecovery(profileName: string, pin: string): Promise<RecoveryResult | null>

// Restore all user data from cloud to local IndexedDB
restoreFromCloud(cloudUser: RecoveryResult): Promise<void>

// Change PIN (requires current PIN verification)
changeRecoveryPin(userId: string, currentPin: string, newPin: string): Promise<boolean>
```

---

## Notes for Future Sessions

- Always use **squared edges** (no rounded corners)
- Use **uppercase** for labels and section titles
- Use **font-mono** for numbers and data
- All user-facing text must be in **Hungarian**
- Follow the brutalist/industrial design aesthetic
- Check PRD.md for algorithm details (progressive overload, 1RM calculation)
- **Avoid `crypto.randomUUID()`** - use fallback UUID generator for mobile Safari compatibility
- **Use `dvh` units** for full-height layouts to handle Safari address bar
