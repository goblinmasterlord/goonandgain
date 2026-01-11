# Prompt: Exercise Media Mapping Task

**Copy this entire prompt into a new Claude session to work on exercise media mapping in parallel.**

---

## Task Overview

I need you to help me map my 50 gym exercises to external exercise databases so I can get GIF/video demonstrations for each exercise. This is part of the GoonAndGain app - a Hungarian-language PWA gym planner.

---

## CRITICAL: Read These Files First

Before doing anything, read these files in this order:

1. **`src/data/exercises.ts`** - Contains all 50 exercises with their IDs, English names, Hungarian names, and muscle groups
2. **`IMPLEMENTATION_PLAN_EXERCISE_VIDEOS.md`** - The full implementation plan for context
3. **`src/types/index.ts`** - Exercise type definition

---

## Your Deliverable

Create/update the file `src/data/exerciseMedia.ts` with mappings for ALL 50 exercises.

### Output Format

```typescript
/**
 * Exercise Media Mapping
 *
 * Maps GoonAndGain exercise IDs to external database IDs for GIF/image lookup.
 *
 * Sources:
 * - ExerciseDB: https://github.com/ExerciseDB/exercisedb-api (GIFs)
 * - free-exercise-db: https://github.com/yuhonas/free-exercise-db (Images)
 *
 * Generated: [DATE]
 */

export interface ExerciseMediaMapping {
  exerciseId: string           // Our exercise ID (from exercises.ts)
  nameEn: string               // English name for reference

  // ExerciseDB mapping (for GIFs) - https://exercisedb.dev
  exerciseDbId?: string        // ExerciseDB exercise ID/slug
  exerciseDbName?: string      // Exact name in ExerciseDB

  // free-exercise-db mapping (for static images fallback)
  // https://github.com/yuhonas/free-exercise-db
  freeExerciseDbId?: string    // Folder name in free-exercise-db
  freeExerciseDbName?: string  // Exact name in free-exercise-db

  // Status
  status: 'mapped' | 'partial' | 'not-found'
  notes?: string               // Any notes about the mapping
}

export const exerciseMediaMappings: ExerciseMediaMapping[] = [
  // ============================================================================
  // CHEST EXERCISES (8)
  // ============================================================================
  {
    exerciseId: 'flat-barbell-bench-press',
    nameEn: 'Flat Barbell Bench Press',
    exerciseDbId: 'barbell-bench-press',
    exerciseDbName: 'Barbell Bench Press',
    freeExerciseDbId: 'Barbell_Bench_Press_-_Medium_Grip',
    freeExerciseDbName: 'Barbell Bench Press - Medium Grip',
    status: 'mapped',
  },
  // ... continue for all 50 exercises
]

// Helper function
export function getExerciseMedia(exerciseId: string): ExerciseMediaMapping | undefined {
  return exerciseMediaMappings.find(m => m.exerciseId === exerciseId)
}

// Stats helper
export function getMediaMappingStats() {
  const total = exerciseMediaMappings.length
  const mapped = exerciseMediaMappings.filter(m => m.status === 'mapped').length
  const partial = exerciseMediaMappings.filter(m => m.status === 'partial').length
  const notFound = exerciseMediaMappings.filter(m => m.status === 'not-found').length
  return { total, mapped, partial, notFound }
}
```

---

## Exercise List to Map (50 total)

Here are all the exercises from `src/data/exercises.ts`:

### Chest (8)
| Our ID | English Name |
|--------|--------------|
| `flat-barbell-bench-press` | Flat Barbell Bench Press |
| `incline-dumbbell-press` | Incline Dumbbell Press |
| `cable-fly` | Cable Fly |
| `chest-dips` | Chest Dips |
| `machine-chest-press` | Machine Chest Press |
| `dumbbell-bench-press` | Dumbbell Bench Press |
| `dumbbell-fly` | Dumbbell Fly |
| `pec-deck` | Pec Deck Machine |

### Back (10)
| Our ID | English Name |
|--------|--------------|
| `barbell-row` | Barbell Row |
| `deadlift` | Deadlift |
| `lat-pulldown-wide` | Lat Pulldown (Wide Grip) |
| `seated-cable-row` | Seated Cable Row |
| `single-arm-dumbbell-row` | Single-arm Dumbbell Row |
| `face-pulls` | Face Pulls |
| `straight-arm-pulldown` | Straight-arm Pulldown |
| `pull-ups` | Pull-ups |
| `chin-ups` | Chin-ups |

### Shoulders (8)
| Our ID | English Name |
|--------|--------------|
| `overhead-press-barbell` | Overhead Press (Barbell) |
| `overhead-press-dumbbell` | Overhead Press (Dumbbell) |
| `lateral-raise` | Lateral Raise |
| `rear-delt-fly` | Rear Delt Fly |
| `cable-front-raise` | Cable Front Raise |
| `barbell-shrugs` | Barbell Shrugs |
| `dumbbell-shrugs` | Dumbbell Shrugs |
| `cable-lateral-raise` | Cable Lateral Raise |

### Arms (10)
| Our ID | English Name |
|--------|--------------|
| `barbell-curl` | Barbell Curl |
| `close-grip-bench-press` | Close-grip Bench Press |
| `incline-dumbbell-curl` | Incline Dumbbell Curl |
| `overhead-tricep-extension` | Overhead Tricep Extension |
| `hammer-curl` | Hammer Curl |
| `tricep-pushdown` | Tricep Pushdown |
| `preacher-curl` | Preacher Curl |
| `skull-crushers` | Skull Crushers |
| `cable-curl` | Cable Curl |
| `tricep-dips` | Tricep Dips |

### Legs (11)
| Our ID | English Name |
|--------|--------------|
| `barbell-back-squat` | Barbell Back Squat |
| `romanian-deadlift` | Romanian Deadlift |
| `leg-press` | Leg Press |
| `lying-leg-curl` | Lying Leg Curl |
| `leg-extension` | Leg Extension |
| `standing-calf-raise` | Standing Calf Raise |
| `bulgarian-split-squat` | Bulgarian Split Squat |
| `hack-squat` | Hack Squat |
| `seated-calf-raise` | Seated Calf Raise |
| `hip-thrust` | Hip Thrust |
| `goblet-squat` | Goblet Squat |

---

## External Database Resources

### 1. ExerciseDB (Primary - for GIFs)

**Browser/Search:**
- Website: https://exercisedb.dev
- API Playground: https://exercisedb.dev/docs
- GitHub: https://github.com/ExerciseDB/exercisedb-api

**How to find exercise IDs:**
1. Go to the ExerciseDB website or API docs
2. Search by exercise name or muscle group
3. Note the exact exercise ID/slug used

**GIF URL Pattern:**
```
https://[exercisedb-cdn]/exercises/{exerciseId}.gif
```

**Data structure:**
```json
{
  "exerciseId": "string",
  "name": "string",
  "bodyParts": ["string"],
  "targetMuscles": ["string"],
  "equipments": ["string"],
  "gifUrl": "string",
  "instructions": ["string"]
}
```

### 2. free-exercise-db (Fallback - for static images)

**Browser:**
- Live search: https://yuhonas.github.io/free-exercise-db/
- GitHub: https://github.com/yuhonas/free-exercise-db

**How to find exercise IDs:**
1. Go to https://yuhonas.github.io/free-exercise-db/
2. Search for the exercise name
3. Note the exact folder name (uses underscores, e.g., `Barbell_Bench_Press_-_Medium_Grip`)

**Image URL Pattern:**
```
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{folder_name}/0.jpg
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{folder_name}/1.jpg
```

**Data structure:**
```json
{
  "id": "Barbell_Bench_Press_-_Medium_Grip",
  "name": "Barbell Bench Press - Medium Grip",
  "force": "push",
  "level": "beginner",
  "mechanic": "compound",
  "equipment": "barbell",
  "primaryMuscles": ["chest"],
  "secondaryMuscles": ["shoulders", "triceps"],
  "instructions": ["..."],
  "images": ["Barbell_Bench_Press_-_Medium_Grip/0.jpg", "Barbell_Bench_Press_-_Medium_Grip/1.jpg"]
}
```

---

## Mapping Strategy

### For each exercise:

1. **Search ExerciseDB first** (preferred - has GIFs)
   - Use the exercise English name
   - Try variations if exact match not found
   - Note the exact ID and name

2. **Search free-exercise-db second** (fallback - static images)
   - Go to https://yuhonas.github.io/free-exercise-db/
   - Search for the exercise
   - Note the exact folder ID

3. **Set status:**
   - `mapped` - Found in both databases (ideal)
   - `partial` - Found in one database only
   - `not-found` - Not found in either (add notes on alternatives)

### Common name variations to try:

| Our Term | Try Also |
|----------|----------|
| Press | Bench Press, Chest Press |
| Fly | Flye, Flyes, Crossover |
| Curl | Bicep Curl, Biceps Curl |
| Row | Rowing |
| Pulldown | Pull Down, Pull-down |
| Raise | Raises |
| Dumbbell | DB |
| Barbell | BB |

---

## Verification Steps

After creating the mapping file:

1. **Test a few image URLs** to confirm they load:
   ```
   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg
   ```

2. **Count your mappings:**
   - Total: 50
   - Mapped (both sources): ?
   - Partial (one source): ?
   - Not found: ?

3. **Document any exercises that need alternatives** in the notes field

---

## Output Location

Save your completed mapping to:
```
src/data/exerciseMedia.ts
```

---

## Example Completed Mapping

Here's a fully completed example for reference:

```typescript
{
  exerciseId: 'flat-barbell-bench-press',
  nameEn: 'Flat Barbell Bench Press',
  exerciseDbId: '0025',
  exerciseDbName: 'barbell bench press',
  freeExerciseDbId: 'Barbell_Bench_Press_-_Medium_Grip',
  freeExerciseDbName: 'Barbell Bench Press - Medium Grip',
  status: 'mapped',
},
{
  exerciseId: 'cable-fly',
  nameEn: 'Cable Fly',
  exerciseDbId: '0160',
  exerciseDbName: 'cable crossover',
  freeExerciseDbId: 'Cable_Crossover',
  freeExerciseDbName: 'Cable Crossover',
  status: 'mapped',
  notes: 'ExerciseDB uses "crossover" instead of "fly"',
},
{
  exerciseId: 'some-rare-exercise',
  nameEn: 'Some Rare Exercise',
  exerciseDbId: undefined,
  exerciseDbName: undefined,
  freeExerciseDbId: 'Some_Rare_Exercise',
  freeExerciseDbName: 'Some Rare Exercise',
  status: 'partial',
  notes: 'Not found in ExerciseDB, using free-exercise-db images only',
},
```

---

## Questions to Ask If Stuck

If you can't find a match for an exercise, consider:

1. Is there a similar exercise with a different name?
2. Is there a machine vs free-weight variant available?
3. Should we use a close alternative and note it?

Document any decisions in the `notes` field.

---

## When You're Done

1. Create the complete `src/data/exerciseMedia.ts` file
2. Provide a summary:
   - Total mapped: X/50
   - Partial: X
   - Not found: X
   - Any exercises needing attention

Good luck! This mapping will enable GIF demonstrations for all exercises in the app.
