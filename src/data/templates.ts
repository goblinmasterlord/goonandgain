import type { WorkoutTemplate, SplitType } from '@/types'

/**
 * Workout Templates
 *
 * Each template defines a workout day with exercises, sets, reps, and rest times.
 * Based on a bro split with 5 primary days + 1 flex day.
 *
 * To add a template:
 * 1. Define the template object following the structure below
 * 2. Reference exercise IDs from exercises.ts
 * 3. Add to the allTemplates array
 */

// ============================================================================
// CHEST DAY (~18 working sets)
// ============================================================================

export const chestDayTemplate: WorkoutTemplate = {
  id: 'chest-day',
  nameHu: 'Mellnap',
  nameEn: 'Chest Day',
  muscleFocus: 'chest',
  exercises: [
    {
      exerciseId: 'flat-barbell-bench-press',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180, // 3 min for heavy compound
    },
    {
      exerciseId: 'incline-dumbbell-press',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120, // 2 min
    },
    {
      exerciseId: 'cable-fly',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 90, // 90 sec for isolation
    },
    {
      exerciseId: 'chest-dips',
      order: 4,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'machine-chest-press',
      order: 5,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 90, // Burnout, less rest
    },
  ],
}

// ============================================================================
// BACK DAY (~20 working sets) - TODO: Add exercises first
// ============================================================================

export const backDayTemplate: WorkoutTemplate = {
  id: 'back-day',
  nameHu: 'Hátnap',
  nameEn: 'Back Day',
  muscleFocus: 'back',
  exercises: [
    {
      exerciseId: 'deadlift',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180, // 3 min for heavy compound
    },
    {
      exerciseId: 'barbell-row',
      order: 2,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 150,
    },
    {
      exerciseId: 'lat-pulldown-wide',
      order: 3,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'seated-cable-row',
      order: 4,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'face-pulls',
      order: 5,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 90,
    },
    {
      exerciseId: 'straight-arm-pulldown',
      order: 6,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 90,
    },
  ],
}

// ============================================================================
// SHOULDERS DAY (~16 working sets) - TODO: Add exercises first
// ============================================================================

export const shouldersDayTemplate: WorkoutTemplate = {
  id: 'shoulders-day',
  nameHu: 'Vállnap',
  nameEn: 'Shoulders Day',
  muscleFocus: 'shoulders',
  exercises: [
    {
      exerciseId: 'overhead-press-barbell',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180, // 3 min for heavy compound
    },
    {
      exerciseId: 'overhead-press-dumbbell',
      order: 2,
      targetSets: 3,
      targetRepMin: 6,
      targetRepMax: 10,
      restSeconds: 120,
    },
    {
      exerciseId: 'lateral-raise',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 90,
    },
    {
      exerciseId: 'rear-delt-fly',
      order: 4,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 90,
    },
    {
      exerciseId: 'barbell-shrugs',
      order: 5,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 90,
    },
  ],
}

// ============================================================================
// ARMS DAY (~18 working sets) - TODO: Add exercises first
// ============================================================================

export const armsDayTemplate: WorkoutTemplate = {
  id: 'arms-day',
  nameHu: 'Karnap',
  nameEn: 'Arms Day',
  muscleFocus: 'arms',
  exercises: [
    {
      exerciseId: 'barbell-curl',
      order: 1,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 10,
      restSeconds: 120,
    },
    {
      exerciseId: 'close-grip-bench-press',
      order: 2,
      targetSets: 3,
      targetRepMin: 6,
      targetRepMax: 10,
      restSeconds: 150,
    },
    {
      exerciseId: 'incline-dumbbell-curl',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 90,
    },
    {
      exerciseId: 'overhead-tricep-extension',
      order: 4,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 90,
    },
    {
      exerciseId: 'hammer-curl',
      order: 5,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 90,
    },
    {
      exerciseId: 'tricep-pushdown',
      order: 6,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 90,
    },
  ],
}

// ============================================================================
// LEGS DAY (~18 working sets) - TODO: Add exercises first
// ============================================================================

export const legsDayTemplate: WorkoutTemplate = {
  id: 'legs-day',
  nameHu: 'Lábnap',
  nameEn: 'Legs Day',
  muscleFocus: 'legs',
  exercises: [
    {
      exerciseId: 'barbell-back-squat',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180, // 3 min for heavy compound
    },
    {
      exerciseId: 'romanian-deadlift',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 10,
      restSeconds: 150,
    },
    {
      exerciseId: 'leg-press',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 120,
    },
    {
      exerciseId: 'lying-leg-curl',
      order: 4,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 90,
    },
    {
      exerciseId: 'leg-extension',
      order: 5,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 90,
    },
    {
      exerciseId: 'standing-calf-raise',
      order: 6,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
  ],
}

// ============================================================================
// FLEX DAY (Adaptive) - User choice or smart suggestion
// ============================================================================

export const flexDayTemplate: WorkoutTemplate = {
  id: 'flex-day',
  nameHu: 'Rugalmas nap',
  nameEn: 'Flex Day',
  muscleFocus: 'flex',
  exercises: [], // Loaded dynamically based on user choice
}

// ============================================================================
// PPL TEMPLATES
// Push/Pull/Legs split with A/B variations for optimal 2x frequency
// ============================================================================

// ============================================================================
// PUSH A - Chest Focused (~19 working sets)
// ============================================================================

export const pushDayATemplate: WorkoutTemplate = {
  id: 'push-day-a',
  nameHu: 'Push A (Mell)',
  nameEn: 'Push Day A (Chest Focus)',
  muscleFocus: 'push',
  exercises: [
    {
      exerciseId: 'flat-barbell-bench-press',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180,
    },
    {
      exerciseId: 'incline-dumbbell-press',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'cable-fly',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 90,
    },
    {
      exerciseId: 'overhead-press-dumbbell',
      order: 4,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 10,
      restSeconds: 120,
    },
    {
      exerciseId: 'lateral-raise',
      order: 5,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'tricep-pushdown',
      order: 6,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 60,
    },
  ],
}

// ============================================================================
// PUSH B - Shoulder Focused (~19 working sets)
// ============================================================================

export const pushDayBTemplate: WorkoutTemplate = {
  id: 'push-day-b',
  nameHu: 'Push B (Váll)',
  nameEn: 'Push Day B (Shoulder Focus)',
  muscleFocus: 'push',
  exercises: [
    {
      exerciseId: 'overhead-press-barbell',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180,
    },
    {
      exerciseId: 'incline-dumbbell-press',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'dumbbell-bench-press',
      order: 3,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'lateral-raise',
      order: 4,
      targetSets: 4,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'cable-fly',
      order: 5,
      targetSets: 2,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 90,
    },
    {
      exerciseId: 'overhead-tricep-extension',
      order: 6,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 60,
    },
  ],
}

// ============================================================================
// PULL A - Back Width Focused (~18 working sets)
// ============================================================================

export const pullDayATemplate: WorkoutTemplate = {
  id: 'pull-day-a',
  nameHu: 'Pull A (Szélesség)',
  nameEn: 'Pull Day A (Back Width Focus)',
  muscleFocus: 'pull',
  exercises: [
    {
      exerciseId: 'barbell-row',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180,
    },
    {
      exerciseId: 'lat-pulldown-wide',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'seated-cable-row',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'face-pulls',
      order: 4,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'barbell-curl',
      order: 5,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 10,
      restSeconds: 90,
    },
    {
      exerciseId: 'hammer-curl',
      order: 6,
      targetSets: 2,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 60,
    },
  ],
}

// ============================================================================
// PULL B - Back Thickness Focused (~18 working sets)
// ============================================================================

export const pullDayBTemplate: WorkoutTemplate = {
  id: 'pull-day-b',
  nameHu: 'Pull B (Vastagság)',
  nameEn: 'Pull Day B (Back Thickness Focus)',
  muscleFocus: 'pull',
  exercises: [
    {
      exerciseId: 'deadlift',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180,
    },
    {
      exerciseId: 'single-arm-dumbbell-row',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'lat-pulldown-wide',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'straight-arm-pulldown',
      order: 4,
      targetSets: 2,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'rear-delt-fly',
      order: 5,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'incline-dumbbell-curl',
      order: 6,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 60,
    },
  ],
}

// ============================================================================
// LEGS A - Quad Focused (~19 working sets)
// ============================================================================

export const legsDayATemplate: WorkoutTemplate = {
  id: 'legs-day-a',
  nameHu: 'Láb A (Comb)',
  nameEn: 'Legs Day A (Quad Focus)',
  muscleFocus: 'legs',
  exercises: [
    {
      exerciseId: 'barbell-back-squat',
      order: 1,
      targetSets: 4,
      targetRepMin: 5,
      targetRepMax: 8,
      restSeconds: 180,
    },
    {
      exerciseId: 'leg-press',
      order: 2,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15,
      restSeconds: 120,
    },
    {
      exerciseId: 'romanian-deadlift',
      order: 3,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 10,
      restSeconds: 150,
    },
    {
      exerciseId: 'leg-extension',
      order: 4,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'lying-leg-curl',
      order: 5,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 60,
    },
    {
      exerciseId: 'standing-calf-raise',
      order: 6,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
  ],
}

// ============================================================================
// LEGS B - Posterior Focused (~19 working sets)
// ============================================================================

export const legsDayBTemplate: WorkoutTemplate = {
  id: 'legs-day-b',
  nameHu: 'Láb B (Hátsó)',
  nameEn: 'Legs Day B (Posterior Focus)',
  muscleFocus: 'legs',
  exercises: [
    {
      exerciseId: 'romanian-deadlift',
      order: 1,
      targetSets: 4,
      targetRepMin: 6,
      targetRepMax: 8,
      restSeconds: 180,
    },
    {
      exerciseId: 'hack-squat',
      order: 2,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 120,
    },
    {
      exerciseId: 'bulgarian-split-squat',
      order: 3,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 90,
    },
    {
      exerciseId: 'lying-leg-curl',
      order: 4,
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 12,
      restSeconds: 60,
    },
    {
      exerciseId: 'leg-extension',
      order: 5,
      targetSets: 3,
      targetRepMin: 12,
      targetRepMax: 15,
      restSeconds: 60,
    },
    {
      exerciseId: 'seated-calf-raise',
      order: 6,
      targetSets: 3,
      targetRepMin: 15,
      targetRepMax: 20,
      restSeconds: 45,
    },
  ],
}

// ============================================================================
// ALL TEMPLATES
// ============================================================================

// Bro Split templates
export const broSplitTemplates: WorkoutTemplate[] = [
  chestDayTemplate,
  backDayTemplate,
  shouldersDayTemplate,
  armsDayTemplate,
  legsDayTemplate,
  flexDayTemplate,
]

// PPL templates (in chronological order: week 1 rotation, then week 2)
export const pplTemplates: WorkoutTemplate[] = [
  pushDayATemplate,
  pullDayATemplate,
  legsDayATemplate,
  pushDayBTemplate,
  pullDayBTemplate,
  legsDayBTemplate,
]

// All templates combined
export const allTemplates: WorkoutTemplate[] = [
  ...broSplitTemplates,
  ...pplTemplates,
]

// Helper to get template by ID
export function getTemplateById(id: string): WorkoutTemplate | undefined {
  return allTemplates.find((t) => t.id === id)
}

// Helper to get template by muscle focus
export function getTemplateByMuscle(muscle: string): WorkoutTemplate | undefined {
  return allTemplates.find((t) => t.muscleFocus === muscle)
}

// Calculate total sets for a template
export function getTemplateTotalSets(template: WorkoutTemplate): number {
  return template.exercises.reduce((sum, e) => sum + e.targetSets, 0)
}

// Calculate estimated duration (in minutes)
export function getTemplateEstimatedDuration(template: WorkoutTemplate): number {
  const totalSets = getTemplateTotalSets(template)
  const avgSetTime = 45 // seconds per set (including effort)
  const totalRestTime = template.exercises.reduce(
    (sum, e) => sum + e.restSeconds * (e.targetSets - 1), // rest between sets, not after last
    0
  )
  return Math.round((totalSets * avgSetTime + totalRestTime) / 60)
}

// Get templates by split type
export function getTemplatesBySplit(splitType: SplitType): WorkoutTemplate[] {
  if (splitType === 'ppl') {
    return pplTemplates
  }
  // Default to bro-split, but filter out flex day since it has no exercises
  return broSplitTemplates.filter(t => t.exercises.length > 0)
}

// Get all available templates for a split (with exercises)
export function getAvailableTemplatesBySplit(splitType: SplitType): WorkoutTemplate[] {
  return getTemplatesBySplit(splitType).filter(t => t.exercises.length > 0)
}
