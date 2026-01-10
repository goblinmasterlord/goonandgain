# Task: Add Remaining Exercise Data

## Context
GoonAndGain is a Hungarian-language gym planner app. We need to add exercise data for **back, shoulders, arms, and legs** muscle groups. Chest exercises are already complete (8 exercises) and serve as the reference pattern.

---

## Files to Read First

Read these files in order to understand the structure:

1. **`src/data/exercises.ts`** - See existing chest exercises for the exact pattern
2. **`src/data/templates.ts`** - See how exercises are used in workout templates
3. **`src/types/index.ts`** - TypeScript interfaces (Exercise, MuscleGroup, Equipment)
4. **`PRD.md`** sections 4.1 (Exercise Library) and 4.2 (Workout Templates) - Lists all exercises needed

---

## Exercise Structure

Each exercise must follow this TypeScript interface:

```typescript
{
  id: string,                      // kebab-case unique slug
  nameHu: string,                  // Hungarian name
  nameEn: string,                  // English name
  muscleGroupPrimary: MuscleGroup, // Main muscle worked
  muscleGroupsSecondary: MuscleGroup[], // Supporting muscles
  type: 'compound' | 'isolation',
  equipment: Equipment,
  defaultRepRangeMin: number,
  defaultRepRangeMax: number,
  instructionsHu: string[],        // 4-5 form cues in Hungarian
  mistakesToAvoidHu: string[],     // 2-3 common mistakes in Hungarian
  alternativeExerciseIds: string[], // IDs of alternative exercises
  isBodyweight: boolean,
}
```

### Valid MuscleGroup values:
`chest`, `back`, `shoulders`, `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`, `calves`, `core`, `forearms`, `traps`, `rear_delts`, `front_delts`, `side_delts`

### Valid Equipment values:
`barbell`, `dumbbell`, `cable`, `machine`, `bodyweight`, `kettlebell`, `ez_bar`

---

## Exercises to Add

### BACK DAY (from PRD section 4.2)
| Exercise | Type | Equipment | Rep Range |
|----------|------|-----------|-----------|
| Barbell Row | compound | barbell | 5-8 |
| Deadlift | compound | barbell | 5-8 |
| Lat Pulldown (wide grip) | compound | cable | 8-12 |
| Seated Cable Row | compound | cable | 8-12 |
| Single-arm Dumbbell Row | compound | dumbbell | 10-12 |
| Face Pulls | isolation | cable | 12-15 |
| Straight-arm Pulldown | isolation | cable | 12-15 |
| Pull-ups | compound | bodyweight | 6-12 |
| Chin-ups | compound | bodyweight | 6-12 |

### SHOULDERS DAY
| Exercise | Type | Equipment | Rep Range |
|----------|------|-----------|-----------|
| Overhead Press (Barbell) | compound | barbell | 5-8 |
| Overhead Press (Dumbbell) | compound | dumbbell | 6-10 |
| Lateral Raise | isolation | dumbbell | 10-15 |
| Rear Delt Fly | isolation | dumbbell/cable | 12-15 |
| Cable Front Raise | isolation | cable | 10-12 |
| Barbell Shrugs | isolation | barbell | 10-12 |
| Dumbbell Shrugs | isolation | dumbbell | 10-12 |
| Cable Lateral Raise | isolation | cable | 12-15 |

### ARMS DAY
| Exercise | Type | Equipment | Rep Range |
|----------|------|-----------|-----------|
| Barbell Curl | compound | barbell | 8-10 |
| Close-grip Bench Press | compound | barbell | 6-10 |
| Incline Dumbbell Curl | isolation | dumbbell | 10-12 |
| Overhead Tricep Extension | isolation | dumbbell/cable | 10-12 |
| Hammer Curl | isolation | dumbbell | 10-12 |
| Tricep Pushdown | isolation | cable | 12-15 |
| Preacher Curl | isolation | ez_bar | 10-12 |
| Skull Crushers | isolation | ez_bar | 8-12 |
| Cable Curl | isolation | cable | 12-15 |
| Tricep Dips | compound | bodyweight | 8-12 |

### LEGS DAY
| Exercise | Type | Equipment | Rep Range |
|----------|------|-----------|-----------|
| Barbell Back Squat | compound | barbell | 5-8 |
| Romanian Deadlift | compound | barbell | 8-10 |
| Leg Press | compound | machine | 10-15 |
| Lying Leg Curl | isolation | machine | 10-12 |
| Leg Extension | isolation | machine | 12-15 |
| Standing Calf Raise | isolation | machine | 12-15 |
| Bulgarian Split Squat | compound | dumbbell | 8-12 |
| Hack Squat | compound | machine | 8-12 |
| Seated Calf Raise | isolation | machine | 15-20 |
| Hip Thrust | compound | barbell | 8-12 |
| Goblet Squat | compound | dumbbell | 10-15 |

---

## Hungarian Translation Notes

Use these patterns for Hungarian form cues:

**Starting positions:**
- "Állj..." = Stand...
- "Feküdj..." = Lie down...
- "Ülj..." = Sit...
- "Fogd meg..." = Grab/Hold...
- "Tartsd..." = Keep/Hold...

**Movement cues:**
- "Húzd..." = Pull...
- "Nyomd..." = Push/Press...
- "Emeld..." = Raise/Lift...
- "Engedd le..." = Lower...
- "Hajlítsd..." = Bend/Flex...
- "Nyújtsd..." = Extend/Stretch...

**Body parts:**
- lapockák = shoulder blades
- könyök = elbow
- csípő = hip
- térd = knee
- gerinc = spine
- váll = shoulder
- mell = chest
- hát = back
- kar = arm
- láb = leg
- comb = thigh
- vádli = calf

**Common instruction phrases:**
- "Húzd össze a lapockáidat" = Squeeze your shoulder blades together
- "Tartsd a hátad egyenesen" = Keep your back straight
- "Ne lendíts" = Don't use momentum
- "Kontrolláltan engedd vissza" = Lower with control
- "Feszítsd meg a törzsed" = Brace your core

---

## After Adding Exercises

1. Update the workout templates in `src/data/templates.ts`:
   - `backDayTemplate.exercises`
   - `shouldersDayTemplate.exercises`
   - `armsDayTemplate.exercises`
   - `legsDayTemplate.exercises`

2. Make sure to link alternative exercises properly (alternativeExerciseIds)

3. Run `npx tsc --noEmit` to verify no type errors

---

## Example (Reference the chest exercises)

Look at `flat-barbell-bench-press` in exercises.ts as the gold standard. Each exercise should have:
- 4-5 clear instruction steps in Hungarian
- 2-3 common mistakes in Hungarian
- Proper alternative exercise links
- Correct muscle group assignments (primary + secondary)

---

## Output Format

Add exercises to `src/data/exercises.ts` in their respective arrays:
- `backExercises: Exercise[]`
- `shoulderExercises: Exercise[]`
- `armExercises: Exercise[]`
- `legExercises: Exercise[]`

Then update the templates in `src/data/templates.ts` with the exercise IDs.
