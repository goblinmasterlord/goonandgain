# Implementation Plan: Exercise Video/GIF Support

**Created:** January 2025
**Status:** Ready for implementation
**Estimated Tasks:** 8 main tasks

---

## Overview

Add animated GIF demonstrations to exercises using the **free-exercise-db** (public domain) as primary source, with **ExerciseDB** as secondary source for missing exercises.

### Why These Sources?

| Source | Exercises | Media | License | Cost |
|--------|-----------|-------|---------|------|
| [free-exercise-db](https://github.com/yuhonas/free-exercise-db) | 800+ | Static images (2+ per exercise) | Public Domain | FREE |
| [ExerciseDB v1](https://github.com/ExerciseDB/exercisedb-api) | 1,300+ | Animated GIFs | Open Source | FREE (self-host) |

**Decision:** Use ExerciseDB GIFs as primary (better UX with animations), free-exercise-db images as fallback.

---

## Current State

### Exercise Type (src/types/index.ts)
```typescript
export interface Exercise {
  id: string
  nameHu: string
  nameEn: string
  muscleGroupPrimary: MuscleGroup
  muscleGroupsSecondary: MuscleGroup[]
  type: 'compound' | 'isolation'
  equipment: Equipment
  defaultRepRangeMin: number
  defaultRepRangeMax: number
  instructionsHu: string[]
  mistakesToAvoidHu: string[]
  alternativeExerciseIds: string[]
  isBodyweight: boolean
  // NO media fields currently
}
```

### Current Exercises (50 total)
Located in `src/data/exercises.ts`:

**Chest (8):** flat-barbell-bench-press, incline-dumbbell-press, cable-fly, chest-dips, machine-chest-press, dumbbell-bench-press, dumbbell-fly, pec-deck

**Back (10):** barbell-row, deadlift, lat-pulldown-wide, seated-cable-row, single-arm-dumbbell-row, face-pulls, straight-arm-pulldown, pull-ups, chin-ups

**Shoulders (8):** overhead-press-barbell, overhead-press-dumbbell, lateral-raise, rear-delt-fly, cable-front-raise, barbell-shrugs, dumbbell-shrugs, cable-lateral-raise

**Arms (10):** barbell-curl, close-grip-bench-press, incline-dumbbell-curl, overhead-tricep-extension, hammer-curl, tricep-pushdown, preacher-curl, skull-crushers, cable-curl, tricep-dips

**Legs (11):** barbell-back-squat, romanian-deadlift, leg-press, lying-leg-curl, leg-extension, standing-calf-raise, bulgarian-split-squat, hack-squat, seated-calf-raise, hip-thrust, goblet-squat

---

## Implementation Tasks

### Task 1: Extend Exercise Type ✅
**File:** `src/types/index.ts`

Add optional media fields to the Exercise interface:

```typescript
export interface Exercise {
  // ... existing fields ...

  // Media fields (optional - not all exercises may have media)
  gifUrl?: string           // Animated GIF URL (primary)
  imageUrls?: string[]      // Fallback static images (array for multiple angles)
  externalId?: string       // ID mapping to external database (ExerciseDB or free-exercise-db)
}
```

**Why optional?** Allows gradual migration - exercises work without media initially.

---

### Task 2: Create Exercise Media Mapping ✅
**File:** `src/data/exerciseMedia.ts` (NEW)

Create a mapping file that links your exercise IDs to external database IDs:

```typescript
/**
 * Exercise Media Mapping
 *
 * Maps GoonAndGain exercise IDs to external database IDs for GIF/image lookup.
 *
 * Sources:
 * - ExerciseDB: https://github.com/ExerciseDB/exercisedb-api (GIFs)
 * - free-exercise-db: https://github.com/yuhonas/free-exercise-db (Images)
 */

export interface ExerciseMediaMapping {
  // Our exercise ID
  exerciseId: string

  // ExerciseDB mapping (for GIFs)
  exerciseDbId?: string
  exerciseDbGifUrl?: string

  // free-exercise-db mapping (for static images fallback)
  freeExerciseDbId?: string  // Folder name in free-exercise-db
}

export const exerciseMediaMappings: ExerciseMediaMapping[] = [
  // CHEST
  {
    exerciseId: 'flat-barbell-bench-press',
    exerciseDbId: 'barbell-bench-press',
    freeExerciseDbId: 'Barbell_Bench_Press_-_Medium_Grip',
  },
  {
    exerciseId: 'incline-dumbbell-press',
    exerciseDbId: 'incline-dumbbell-press',
    freeExerciseDbId: 'Dumbbell_Incline_Press',
  },
  // ... continue for all 50 exercises
]

// Helper to get media for an exercise
export function getExerciseMedia(exerciseId: string): ExerciseMediaMapping | undefined {
  return exerciseMediaMappings.find(m => m.exerciseId === exerciseId)
}
```

---

### Task 3: Research & Complete the Mapping ✅
**Action:** Manually map all 50 exercises to their ExerciseDB/free-exercise-db equivalents.

**Method:**
1. Visit https://yuhonas.github.io/free-exercise-db/ and search for each exercise
2. Visit ExerciseDB docs/playground to find matching exercise IDs
3. Document the mapping in `exerciseMedia.ts`

**Mapping Table to Complete:**

| GoonAndGain ID | ExerciseDB ID | free-exercise-db ID | Status |
|----------------|---------------|---------------------|--------|
| flat-barbell-bench-press | ? | Barbell_Bench_Press_-_Medium_Grip | ⏳ |
| incline-dumbbell-press | ? | Dumbbell_Incline_Press | ⏳ |
| cable-fly | ? | Cable_Crossover | ⏳ |
| chest-dips | ? | Dips_-_Chest_Version | ⏳ |
| ... | ... | ... | ⏳ |

**Note:** This is the most time-consuming task. Consider doing it in batches (chest, back, shoulders, arms, legs).

---

### Task 4: Host Media on Cloudflare R2 (Free) ✅
**Why Cloudflare R2?**
- **10 GB free storage** (your ~50 GIFs = ~100MB, plenty of room)
- **Unlimited bandwidth** (no egress fees - critical for PWA)
- **Global CDN** for fast loading
- **S3-compatible API** for easy uploads

#### Step 4.1: Set Up Cloudflare R2

1. **Create Cloudflare account** (free): https://dash.cloudflare.com/sign-up
2. **Enable R2** in dashboard → R2 Object Storage
3. **Create bucket**: `goonandgain-exercises`
4. **Enable public access**:
   - Go to bucket Settings → Public Access
   - Enable "R2.dev subdomain" (gives you `https://pub-xxx.r2.dev`)
   - OR connect custom domain like `media.goonandgain.app`

#### Step 4.2: Download GIFs Locally First

**Option A: ExerciseDB GIFs (Recommended)**
1. Clone ExerciseDB repo: `git clone https://github.com/ExerciseDB/exercisedb-api`
2. GIFs are in the `media/` folder
3. Copy only the ~50 you need

**Option B: free-exercise-db static images (Fallback)**
1. Download from: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{id}/0.jpg`

#### Step 4.3: Upload to R2

**Using Wrangler CLI (Cloudflare's tool):**
```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Upload all files in a folder
wrangler r2 object put goonandgain-exercises/flat-barbell-bench-press.gif --file=./local/flat-barbell-bench-press.gif

# Or upload entire folder with a script
for file in ./exercises-local/*; do
  wrangler r2 object put "goonandgain-exercises/$(basename $file)" --file="$file"
done
```

**Using S3-compatible tools (aws-cli):**
```bash
# Configure with R2 credentials (from R2 dashboard → Manage R2 API Tokens)
aws configure --profile r2

# Upload
aws s3 sync ./exercises-local s3://goonandgain-exercises --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com --profile r2
```

#### Step 4.4: Environment Configuration

Create `.env` file:
```env
VITE_EXERCISE_MEDIA_BASE_URL=https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev
```

Or for custom domain:
```env
VITE_EXERCISE_MEDIA_BASE_URL=https://media.goonandgain.app
```

#### Step 4.5: Create Media URL Helper

**File:** `src/lib/utils/media.ts`

```typescript
/**
 * Exercise Media URL Helper
 *
 * Uses Cloudflare R2 for hosting exercise GIFs/images.
 * Falls back gracefully if media not found.
 */

const MEDIA_BASE_URL = import.meta.env.VITE_EXERCISE_MEDIA_BASE_URL || ''

export function getExerciseGifUrl(exerciseId: string): string {
  if (!MEDIA_BASE_URL) return ''
  return `${MEDIA_BASE_URL}/${exerciseId}.gif`
}

export function getExerciseImageUrl(exerciseId: string, index = 0): string {
  if (!MEDIA_BASE_URL) return ''
  return `${MEDIA_BASE_URL}/${exerciseId}-${index}.jpg`
}

export function getExerciseMediaUrl(exerciseId: string): string {
  // Prefer GIF, component will fallback to image on error
  return getExerciseGifUrl(exerciseId)
}
```

#### Alternative: Supabase Storage (Simpler if you want)

If you prefer to keep everything in Supabase:

1. Create bucket `exercises` in Supabase Dashboard → Storage
2. Make it public
3. Upload files
4. URL format: `https://your-project.supabase.co/storage/v1/object/public/exercises/bench-press.gif`

**Pros:** Already using Supabase, simpler setup
**Cons:** 10 GB bandwidth/month limit (R2 is unlimited)

#### Final URL Structure

```
https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev/
├── flat-barbell-bench-press.gif
├── flat-barbell-bench-press-0.jpg  (fallback image)
├── incline-dumbbell-press.gif
├── cable-fly.gif
└── ... (50 exercises)
```

---

### Task 5: Create ExerciseMedia Component ✅
**File:** `src/components/workout/ExerciseMedia.tsx` (NEW)

```typescript
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ExerciseMediaProps {
  exerciseId: string
  className?: string
  autoPlay?: boolean // For GIFs in detail view
  showControls?: boolean // Play/pause for GIFs
}

export function ExerciseMedia({
  exerciseId,
  className,
  autoPlay = true,
  showControls = false
}: ExerciseMediaProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPaused, setIsPaused] = useState(!autoPlay)

  // Try GIF first, fallback to static image
  const gifUrl = `/exercises/${exerciseId}.gif`
  const fallbackUrl = `/exercises/${exerciseId}-0.jpg`

  const handleLoad = () => setIsLoading(false)
  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  if (hasError) {
    // Show fallback image or placeholder
    return (
      <div className={cn('relative bg-bg-elevated', className)}>
        <img
          src={fallbackUrl}
          alt="Exercise demonstration"
          className="w-full h-full object-cover"
          onError={() => {
            // No media available - show placeholder
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn('relative bg-bg-elevated overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
        </div>
      )}

      <img
        src={gifUrl}
        alt="Exercise demonstration"
        className={cn(
          'w-full h-full object-contain transition-opacity',
          isLoading ? 'opacity-0' : 'opacity-100',
          isPaused && 'grayscale'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />

      {showControls && !isLoading && (
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="absolute bottom-2 right-2 p-2 bg-bg-primary/80 border border-text-muted/30"
        >
          {isPaused ? '▶' : '⏸'}
        </button>
      )}
    </div>
  )
}
```

---

### Task 6: Integrate into ExerciseDetailPage ✅
**File:** `src/pages/Exercises/ExerciseDetail.tsx`

Add the ExerciseMedia component to the exercise detail page:

```typescript
import { ExerciseMedia } from '@/components/workout/ExerciseMedia'

// In the component, add after the header section:

{/* Exercise Demo GIF/Image */}
<section className="px-5 py-6 border-b border-text-muted/10">
  <div className="section-header">
    <span className="section-title">Bemutató</span>
  </div>
  <ExerciseMedia
    exerciseId={exercise.id}
    className="w-full aspect-video max-h-64"
    showControls={true}
  />
</section>
```

**Placement:** Add this section right after the "Quick stats" grid, before "Megdolgozott izmok".

---

### Task 7: Add Media to Workout SetLogger (Optional) ✅
**File:** `src/components/workout/SetLogger.tsx`

Show a small thumbnail during workout logging:

```typescript
// Add mini preview in the exercise header
<div className="flex items-center gap-3">
  <ExerciseMedia
    exerciseId={currentExercise.id}
    className="w-16 h-16 flex-shrink-0"
    autoPlay={true}
    showControls={false}
  />
  <div>
    <h2>{currentExercise.nameHu}</h2>
    {/* ... rest of header */}
  </div>
</div>
```

---

### Task 8: Update Service Worker for Offline Caching ✅
**File:** `vite.config.ts`

Add exercise media to the PWA cache:

```typescript
// In VitePWA config, add to runtimeCaching:
{
  urlPattern: /^\/exercises\/.*\.(gif|jpg|png)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'exercise-media',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },
},
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add gifUrl, imageUrls, externalId fields |
| `src/data/exerciseMedia.ts` | CREATE | Exercise ID to external DB mapping |
| `src/lib/utils/media.ts` | CREATE | Media URL helper for R2/Supabase |
| `.env` | MODIFY | Add VITE_EXERCISE_MEDIA_BASE_URL |
| `src/components/workout/ExerciseMedia.tsx` | CREATE | Media display component |
| `src/pages/Exercises/ExerciseDetail.tsx` | MODIFY | Add media section |
| `src/components/workout/SetLogger.tsx` | MODIFY | Add mini preview (optional) |
| `vite.config.ts` | MODIFY | Add PWA cache for media |

## External Setup Required

| Service | Action | Notes |
|---------|--------|-------|
| **Cloudflare R2** | Create bucket, enable public access | Free: 10GB storage, unlimited bandwidth |
| **OR Supabase Storage** | Create public bucket | Already integrated, 10GB bandwidth/month limit |

---

## Implementation Order

1. **Task 1:** Extend Exercise type (5 min)
2. **Task 2:** Create exerciseMedia.ts structure (15 min)
3. **Task 3:** Research & complete mappings (1-2 hours) ⚠️ TIME-CONSUMING
4. **Task 4:** Download media files (30 min with script)
5. **Task 5:** Create ExerciseMedia component (20 min)
6. **Task 6:** Integrate into ExerciseDetailPage (10 min)
7. **Task 7:** Add to SetLogger (optional, 15 min)
8. **Task 8:** Update PWA caching (5 min)

**Total Estimated Time:** 3-4 hours

---

## Testing Checklist

- [ ] GIFs load correctly on Exercise Detail page
- [ ] Fallback to static images works when GIF missing
- [ ] Placeholder shown when no media available
- [ ] Media works offline (PWA cached)
- [ ] No CORS issues with self-hosted media
- [ ] Mobile performance acceptable (GIF file sizes)
- [ ] Loading states show correctly

---

## Future Enhancements

1. **Video support:** Add YouTube embed for exercises with video tutorials
2. **Multiple angles:** Show carousel of images (front, side, back views)
3. **Slow-motion:** Add playback speed control for GIFs
4. **User uploads:** Allow users to save their own form check videos

---

## Resources

- [free-exercise-db GitHub](https://github.com/yuhonas/free-exercise-db)
- [free-exercise-db Browser](https://yuhonas.github.io/free-exercise-db/)
- [ExerciseDB API](https://www.exercisedb.dev/)
- [ExerciseDB GitHub](https://github.com/ExerciseDB/exercisedb-api)

---

## Session Continuation Notes

When starting a new session, reference this plan:

```
I'm continuing the Exercise Video/GIF implementation for GoonAndGain.
Please read IMPLEMENTATION_PLAN_EXERCISE_VIDEOS.md for the full plan.
I'm currently on Task [X] - [description].
```
