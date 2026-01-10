# CLAUDE.md - GoonAndGain Project Context

## Project Overview
GoonAndGain is a **Hungarian-language PWA gym planner** for intermediate lifters. It features local-first storage, AI coaching via Gemini, and progressive overload tracking.

**Key Documents:**
- [PRD.md](PRD.md) - Full product requirements (read this for feature details)
- [DESIGN.md](DESIGN.md) - Design philosophy (brutalist, industrial aesthetic)

---

## Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (brutalist design - NO rounded corners)
- **State:** Zustand (session state) + Dexie.js (IndexedDB)
- **AI:** Vercel AI SDK with Gemini (key in `.env`)
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
│   ├── workout/            # SetLogger, RestTimer (DONE)
│   ├── dashboard/          # StrengthBenchmarks (DONE)
│   ├── ai/                 # PostWorkoutFeedback (DONE)
│   ├── pwa/                # OfflineIndicator, InstallPrompt, UpdatePrompt (DONE)
│   └── weight/             # WeightCheckInPrompt (DONE)
├── pages/
│   ├── Onboarding/         # Welcome, PersonalData, TrainingSetup, Ready
│   ├── Home/               # Today's workout overview
│   ├── Workout/            # Active session with SetLogger (DONE)
│   ├── Exercises/          # Exercise library + detail page (DONE)
│   ├── Progress/           # Volume Dashboard with weekly tracking (DONE)
│   ├── History/            # Past sessions with detail modal (DONE)
│   ├── Coach/              # Coach Bebi AI chat (DONE)
│   └── Settings/           # User settings (DONE)
├── lib/
│   ├── db/                 # Dexie database (schema + session/set helpers)
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
  muscleFocus: WorkoutType,      // chest, back, shoulders, arms, legs, flex
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
- [x] Onboarding flow (4 screens)
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
- [x] Coach Bebi AI integration (Gemini)
- [x] Coach page with chat interface
- [x] Post-workout feedback component
- [x] Weekly review feature
- [x] All exercise data (chest, back, shoulders, arms, legs)

### Completed (Phase 4)
- [x] PWA + Offline support
- [x] Settings page with profile management
- [x] Weight check-in reminders

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

## Workout Flow

The workout flow is managed by the `workoutStore` (Zustand):

1. **Start Workout** - User clicks "EDZÉS INDÍTÁSA" on Home page
   - Creates a new session in IndexedDB via `createSession(templateId)`
   - Loads the template and first exercise's last session data
   - URL: `/workout?template=chest-day`

2. **Log Sets** - For each exercise:
   - User enters weight, reps, and RIR (1-4)
   - Clicks "SOROZAT RÖGZÍTÉSE"
   - Set is saved to IndexedDB via `logSet()`
   - Rest timer starts automatically (based on exercise.restSeconds)
   - Advances to next set or next exercise

3. **Swap Exercise** - User can swap current exercise for an alternative
   - Opens modal with alternative exercises
   - Updates the template in-memory (not persisted)

4. **End Workout** - User clicks "Befejezés"
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

The overload engine (`src/lib/workout/overload.ts`) calculates smart weight suggestions:

### Algorithm (from PRD 4.4)
```typescript
// Based on final set of previous session:
if (rir <= 1) → Maintain weight ("Near your max")
if (rir == 2 && reps >= max_rep_range) → +2.5kg compound / +1.25kg isolation ("Progress!")
if (rir >= 3) → +5kg compound / +2.5kg isolation ("Too easy")
if (reps < min_rep_range) → -10% weight ("Reduce for form")
```

### 1RM Calculation (Brzycki Formula)
```typescript
1RM = weight × (36 / (37 - reps))
```

### Key Functions
- `calculate1RM(weight, reps)` - Estimate 1 rep max
- `roundToIncrement(weight, increment)` - Round to nearest 2.5kg
- `analyzeLastSession(sets)` - Get analysis from previous session
- `calculateOverloadSuggestion(exercise, lastSets, repMin, repMax)` - Get suggestion
- `formatLastSessionDisplay(sets)` - Format for display

### Suggestion Types
- `progress` - Ready to add weight (green)
- `maintain` - Hold current weight (accent)
- `easy` - Weight was too light (yellow)
- `reduce` - Failed to hit rep target (red)

### Database Helpers
- `saveEstimatedMax(exerciseId, estimated1RM)` - Save new 1RM
- `getLatestEstimatedMax(exerciseId)` - Get most recent 1RM
- `getEstimatedMaxHistory(exerciseId, limit)` - Get 1RM history

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

Coach Bebi is the AI coach powered by Google Gemini (`src/lib/ai/coach.ts`).

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
- System prompt defines Coach Bebi's personality (motivating, direct, Hungarian)
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

2. **Coach Bebi**
   - Gemini API key management (add/remove)
   - Key stored in localStorage

3. **Alkalmazás (App)**
   - Version display
   - About text

### Features
- Inline editing pattern (expand/collapse)
- Weight changes logged to database history
- Masked API key display ("••••••••••••")

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

## Notes for Future Sessions

- Always use **squared edges** (no rounded corners)
- Use **uppercase** for labels and section titles
- Use **font-mono** for numbers and data
- All user-facing text must be in **Hungarian**
- Follow the brutalist/industrial design aesthetic
- Check PRD.md for algorithm details (progressive overload, 1RM calculation)
