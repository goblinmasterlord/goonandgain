/**
 * Exercise Media Mapping
 *
 * Maps GoonAndGain exercise IDs to external database IDs for GIF/image lookup.
 *
 * Sources:
 * - ExerciseDB: https://github.com/ExerciseDB/exercisedb-api (GIFs)
 * - free-exercise-db: https://github.com/yuhonas/free-exercise-db (Images)
 *
 * Image URL patterns:
 * - free-exercise-db: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{freeExerciseDbId}/0.jpg
 * - ExerciseDB: Uses API to get gifUrl
 *
 * Generated: January 2025
 */

export interface ExerciseMediaMapping {
  exerciseId: string // Our exercise ID (from exercises.ts)
  nameEn: string // English name for reference

  // ExerciseDB mapping (for GIFs) - https://exercisedb.dev
  exerciseDbId?: string // ExerciseDB exercise ID/slug
  exerciseDbName?: string // Exact name in ExerciseDB

  // free-exercise-db mapping (for static images fallback)
  // https://github.com/yuhonas/free-exercise-db
  freeExerciseDbId?: string // Folder name in free-exercise-db
  freeExerciseDbName?: string // Exact name in free-exercise-db

  // Status
  status: 'mapped' | 'partial' | 'not-found'
  notes?: string // Any notes about the mapping
}

export const exerciseMediaMappings: ExerciseMediaMapping[] = [
  // ============================================================================
  // CHEST EXERCISES (8)
  // ============================================================================
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
    exerciseId: 'incline-dumbbell-press',
    nameEn: 'Incline Dumbbell Press',
    exerciseDbId: '0314',
    exerciseDbName: 'dumbbell incline bench press',
    freeExerciseDbId: 'Dumbbell_Incline_Bench_Press',
    freeExerciseDbName: 'Dumbbell Incline Bench Press',
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
    exerciseId: 'chest-dips',
    nameEn: 'Chest Dips',
    exerciseDbId: '0251',
    exerciseDbName: 'chest dip',
    freeExerciseDbId: 'Dips_-_Chest_Version',
    freeExerciseDbName: 'Dips - Chest Version',
    status: 'mapped',
  },
  {
    exerciseId: 'machine-chest-press',
    nameEn: 'Machine Chest Press',
    exerciseDbId: '0430',
    exerciseDbName: 'lever chest press',
    freeExerciseDbId: 'Machine_Bench_Press',
    freeExerciseDbName: 'Machine Bench Press',
    status: 'mapped',
    notes: 'ExerciseDB uses "lever chest press"',
  },
  {
    exerciseId: 'dumbbell-bench-press',
    nameEn: 'Dumbbell Bench Press',
    exerciseDbId: '0289',
    exerciseDbName: 'dumbbell bench press',
    freeExerciseDbId: 'Dumbbell_Bench_Press',
    freeExerciseDbName: 'Dumbbell Bench Press',
    status: 'mapped',
  },
  {
    exerciseId: 'dumbbell-fly',
    nameEn: 'Dumbbell Fly',
    exerciseDbId: '0306',
    exerciseDbName: 'dumbbell fly',
    freeExerciseDbId: 'Dumbbell_Flyes',
    freeExerciseDbName: 'Dumbbell Flyes',
    status: 'mapped',
  },
  {
    exerciseId: 'pec-deck',
    nameEn: 'Pec Deck Machine',
    exerciseDbId: '0863',
    exerciseDbName: 'lever pec deck fly',
    freeExerciseDbId: 'Butterfly',
    freeExerciseDbName: 'Butterfly',
    status: 'mapped',
    notes: 'free-exercise-db uses "Butterfly" for pec deck',
  },

  // ============================================================================
  // BACK EXERCISES (9)
  // ============================================================================
  {
    exerciseId: 'barbell-row',
    nameEn: 'Barbell Row',
    exerciseDbId: '0027',
    exerciseDbName: 'barbell bent over row',
    freeExerciseDbId: 'Barbell_Bent_Over_Row',
    freeExerciseDbName: 'Barbell Bent Over Row',
    status: 'mapped',
  },
  {
    exerciseId: 'deadlift',
    nameEn: 'Deadlift',
    exerciseDbId: '0032',
    exerciseDbName: 'barbell deadlift',
    freeExerciseDbId: 'Barbell_Deadlift',
    freeExerciseDbName: 'Barbell Deadlift',
    status: 'mapped',
  },
  {
    exerciseId: 'lat-pulldown-wide',
    nameEn: 'Lat Pulldown (Wide Grip)',
    exerciseDbId: '0431',
    exerciseDbName: 'cable wide-grip lat pulldown',
    freeExerciseDbId: 'Wide-Grip_Lat_Pulldown',
    freeExerciseDbName: 'Wide-Grip Lat Pulldown',
    status: 'mapped',
  },
  {
    exerciseId: 'seated-cable-row',
    nameEn: 'Seated Cable Row',
    exerciseDbId: '0861',
    exerciseDbName: 'cable seated row',
    freeExerciseDbId: 'Seated_Cable_Rows',
    freeExerciseDbName: 'Seated Cable Rows',
    status: 'mapped',
  },
  {
    exerciseId: 'single-arm-dumbbell-row',
    nameEn: 'Single-arm Dumbbell Row',
    exerciseDbId: '0293',
    exerciseDbName: 'dumbbell bent over row',
    freeExerciseDbId: 'One-Arm_Dumbbell_Row',
    freeExerciseDbName: 'One-Arm Dumbbell Row',
    status: 'mapped',
  },
  {
    exerciseId: 'face-pulls',
    nameEn: 'Face Pulls',
    exerciseDbId: '1356',
    exerciseDbName: 'cable face pull',
    freeExerciseDbId: 'Face_Pull',
    freeExerciseDbName: 'Face Pull',
    status: 'mapped',
  },
  {
    exerciseId: 'straight-arm-pulldown',
    nameEn: 'Straight-arm Pulldown',
    exerciseDbId: '0190',
    exerciseDbName: 'cable straight arm pulldown',
    freeExerciseDbId: 'Straight-Arm_Pulldown',
    freeExerciseDbName: 'Straight-Arm Pulldown',
    status: 'mapped',
  },
  {
    exerciseId: 'pull-ups',
    nameEn: 'Pull-ups',
    exerciseDbId: '0651',
    exerciseDbName: 'pull up',
    freeExerciseDbId: 'Pullups',
    freeExerciseDbName: 'Pullups',
    status: 'mapped',
  },
  {
    exerciseId: 'chin-ups',
    nameEn: 'Chin-ups',
    exerciseDbId: '0253',
    exerciseDbName: 'chin-up',
    freeExerciseDbId: 'Chin-Up',
    freeExerciseDbName: 'Chin-Up',
    status: 'mapped',
  },

  // ============================================================================
  // SHOULDER EXERCISES (8)
  // ============================================================================
  {
    exerciseId: 'overhead-press-barbell',
    nameEn: 'Overhead Press (Barbell)',
    exerciseDbId: '0091',
    exerciseDbName: 'barbell standing military press',
    freeExerciseDbId: 'Standing_Military_Press',
    freeExerciseDbName: 'Standing Military Press',
    status: 'mapped',
    notes: 'Also known as military press or OHP',
  },
  {
    exerciseId: 'overhead-press-dumbbell',
    nameEn: 'Overhead Press (Dumbbell)',
    exerciseDbId: '0405',
    exerciseDbName: 'dumbbell shoulder press',
    freeExerciseDbId: 'Dumbbell_Shoulder_Press',
    freeExerciseDbName: 'Dumbbell Shoulder Press',
    status: 'mapped',
  },
  {
    exerciseId: 'lateral-raise',
    nameEn: 'Lateral Raise',
    exerciseDbId: '0334',
    exerciseDbName: 'dumbbell lateral raise',
    freeExerciseDbId: 'Side_Lateral_Raise',
    freeExerciseDbName: 'Side Lateral Raise',
    status: 'mapped',
  },
  {
    exerciseId: 'rear-delt-fly',
    nameEn: 'Rear Delt Fly',
    exerciseDbId: '0378',
    exerciseDbName: 'dumbbell rear delt fly',
    freeExerciseDbId: 'Dumbbell_Rear_Delt_Row',
    freeExerciseDbName: 'Dumbbell Rear Delt Row',
    status: 'mapped',
    notes: 'free-exercise-db uses "row" variant',
  },
  {
    exerciseId: 'cable-front-raise',
    nameEn: 'Cable Front Raise',
    exerciseDbId: '0162',
    exerciseDbName: 'cable front raise',
    freeExerciseDbId: 'Cable_Front_Raise',
    freeExerciseDbName: 'Cable Front Raise',
    status: 'mapped',
  },
  {
    exerciseId: 'barbell-shrugs',
    nameEn: 'Barbell Shrugs',
    exerciseDbId: '0095',
    exerciseDbName: 'barbell shrug',
    freeExerciseDbId: 'Barbell_Shrug',
    freeExerciseDbName: 'Barbell Shrug',
    status: 'mapped',
  },
  {
    exerciseId: 'dumbbell-shrugs',
    nameEn: 'Dumbbell Shrugs',
    exerciseDbId: '0406',
    exerciseDbName: 'dumbbell shrug',
    freeExerciseDbId: 'Dumbbell_Shrug',
    freeExerciseDbName: 'Dumbbell Shrug',
    status: 'mapped',
  },
  {
    exerciseId: 'cable-lateral-raise',
    nameEn: 'Cable Lateral Raise',
    exerciseDbId: '0172',
    exerciseDbName: 'cable one arm lateral raise',
    freeExerciseDbId: 'Cable_Lateral_Raise',
    freeExerciseDbName: 'Cable Lateral Raise',
    status: 'mapped',
  },

  // ============================================================================
  // ARM EXERCISES (10)
  // ============================================================================
  {
    exerciseId: 'barbell-curl',
    nameEn: 'Barbell Curl',
    exerciseDbId: '0031',
    exerciseDbName: 'barbell curl',
    freeExerciseDbId: 'Barbell_Curl',
    freeExerciseDbName: 'Barbell Curl',
    status: 'mapped',
  },
  {
    exerciseId: 'close-grip-bench-press',
    nameEn: 'Close-grip Bench Press',
    exerciseDbId: '0035',
    exerciseDbName: 'barbell close-grip bench press',
    freeExerciseDbId: 'Close-Grip_Barbell_Bench_Press',
    freeExerciseDbName: 'Close-Grip Barbell Bench Press',
    status: 'mapped',
  },
  {
    exerciseId: 'incline-dumbbell-curl',
    nameEn: 'Incline Dumbbell Curl',
    exerciseDbId: '0316',
    exerciseDbName: 'dumbbell incline curl',
    freeExerciseDbId: 'Incline_Dumbbell_Curl',
    freeExerciseDbName: 'Incline Dumbbell Curl',
    status: 'mapped',
  },
  {
    exerciseId: 'overhead-tricep-extension',
    nameEn: 'Overhead Tricep Extension',
    exerciseDbId: '0392',
    exerciseDbName: 'dumbbell seated triceps extension',
    freeExerciseDbId: 'Triceps_Overhead_Extension_with_Rope',
    freeExerciseDbName: 'Triceps Overhead Extension with Rope',
    status: 'mapped',
    notes: 'free-exercise-db has cable version, dumbbell version also available',
  },
  {
    exerciseId: 'hammer-curl',
    nameEn: 'Hammer Curl',
    exerciseDbId: '0313',
    exerciseDbName: 'dumbbell hammer curl',
    freeExerciseDbId: 'Hammer_Curls',
    freeExerciseDbName: 'Hammer Curls',
    status: 'mapped',
  },
  {
    exerciseId: 'tricep-pushdown',
    nameEn: 'Tricep Pushdown',
    exerciseDbId: '0193',
    exerciseDbName: 'cable pushdown',
    freeExerciseDbId: 'Triceps_Pushdown',
    freeExerciseDbName: 'Triceps Pushdown',
    status: 'mapped',
  },
  {
    exerciseId: 'preacher-curl',
    nameEn: 'Preacher Curl',
    exerciseDbId: '0047',
    exerciseDbName: 'barbell preacher curl',
    freeExerciseDbId: 'Preacher_Curl',
    freeExerciseDbName: 'Preacher Curl',
    status: 'mapped',
  },
  {
    exerciseId: 'skull-crushers',
    nameEn: 'Skull Crushers',
    exerciseDbId: '0055',
    exerciseDbName: 'barbell lying triceps extension skull crusher',
    freeExerciseDbId: 'Lying_Triceps_Press',
    freeExerciseDbName: 'Lying Triceps Press',
    status: 'mapped',
    notes: 'Also known as lying triceps extension',
  },
  {
    exerciseId: 'cable-curl',
    nameEn: 'Cable Curl',
    exerciseDbId: '0152',
    exerciseDbName: 'cable curl',
    freeExerciseDbId: 'Cable_Biceps_Curl',
    freeExerciseDbName: 'Cable Biceps Curl',
    status: 'mapped',
  },
  {
    exerciseId: 'tricep-dips',
    nameEn: 'Tricep Dips',
    exerciseDbId: '0716',
    exerciseDbName: 'triceps dip',
    freeExerciseDbId: 'Dips_-_Triceps_Version',
    freeExerciseDbName: 'Dips - Triceps Version',
    status: 'mapped',
  },

  // ============================================================================
  // LEG EXERCISES (11)
  // ============================================================================
  {
    exerciseId: 'barbell-back-squat',
    nameEn: 'Barbell Back Squat',
    exerciseDbId: '0043',
    exerciseDbName: 'barbell full squat',
    freeExerciseDbId: 'Barbell_Squat',
    freeExerciseDbName: 'Barbell Squat',
    status: 'mapped',
  },
  {
    exerciseId: 'romanian-deadlift',
    nameEn: 'Romanian Deadlift',
    exerciseDbId: '0085',
    exerciseDbName: 'barbell romanian deadlift',
    freeExerciseDbId: 'Romanian_Deadlift',
    freeExerciseDbName: 'Romanian Deadlift',
    status: 'mapped',
  },
  {
    exerciseId: 'leg-press',
    nameEn: 'Leg Press',
    exerciseDbId: '0739',
    exerciseDbName: 'sled leg press',
    freeExerciseDbId: 'Leg_Press',
    freeExerciseDbName: 'Leg Press',
    status: 'mapped',
  },
  {
    exerciseId: 'lying-leg-curl',
    nameEn: 'Lying Leg Curl',
    exerciseDbId: '0599',
    exerciseDbName: 'lever lying leg curl',
    freeExerciseDbId: 'Lying_Leg_Curls',
    freeExerciseDbName: 'Lying Leg Curls',
    status: 'mapped',
  },
  {
    exerciseId: 'leg-extension',
    nameEn: 'Leg Extension',
    exerciseDbId: '0585',
    exerciseDbName: 'lever leg extension',
    freeExerciseDbId: 'Leg_Extensions',
    freeExerciseDbName: 'Leg Extensions',
    status: 'mapped',
  },
  {
    exerciseId: 'standing-calf-raise',
    nameEn: 'Standing Calf Raise',
    exerciseDbId: '1373',
    exerciseDbName: 'lever standing calf raise',
    freeExerciseDbId: 'Standing_Calf_Raises',
    freeExerciseDbName: 'Standing Calf Raises',
    status: 'mapped',
  },
  {
    exerciseId: 'bulgarian-split-squat',
    nameEn: 'Bulgarian Split Squat',
    exerciseDbId: '0278',
    exerciseDbName: 'dumbbell bulgarian split squat',
    freeExerciseDbId: 'Single_Leg_Squat',
    freeExerciseDbName: 'Single Leg Squat',
    status: 'mapped',
    notes: 'free-exercise-db uses generic "Single Leg Squat"',
  },
  {
    exerciseId: 'hack-squat',
    nameEn: 'Hack Squat',
    exerciseDbId: '0574',
    exerciseDbName: 'lever hack squat',
    freeExerciseDbId: 'Hack_Squat',
    freeExerciseDbName: 'Hack Squat',
    status: 'mapped',
  },
  {
    exerciseId: 'seated-calf-raise',
    nameEn: 'Seated Calf Raise',
    exerciseDbId: '1374',
    exerciseDbName: 'lever seated calf raise',
    freeExerciseDbId: 'Seated_Calf_Raise',
    freeExerciseDbName: 'Seated Calf Raise',
    status: 'mapped',
  },
  {
    exerciseId: 'hip-thrust',
    nameEn: 'Hip Thrust',
    exerciseDbId: '0046',
    exerciseDbName: 'barbell hip thrust',
    freeExerciseDbId: 'Barbell_Hip_Thrust',
    freeExerciseDbName: 'Barbell Hip Thrust',
    status: 'mapped',
  },
  {
    exerciseId: 'goblet-squat',
    nameEn: 'Goblet Squat',
    exerciseDbId: '0291',
    exerciseDbName: 'dumbbell goblet squat',
    freeExerciseDbId: 'Goblet_Squat',
    freeExerciseDbName: 'Goblet Squat',
    status: 'mapped',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get media mapping for an exercise
 */
export function getExerciseMedia(exerciseId: string): ExerciseMediaMapping | undefined {
  return exerciseMediaMappings.find((m) => m.exerciseId === exerciseId)
}

/**
 * Get free-exercise-db image URL for an exercise
 * @param exerciseId Our exercise ID
 * @param imageIndex Image index (0 or 1, most exercises have 2 images)
 */
export function getFreeExerciseDbImageUrl(exerciseId: string, imageIndex = 0): string | undefined {
  const mapping = getExerciseMedia(exerciseId)
  if (!mapping?.freeExerciseDbId) return undefined

  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${mapping.freeExerciseDbId}/${imageIndex}.jpg`
}

/**
 * Get all image URLs for an exercise from free-exercise-db
 * Most exercises have 2 images (0.jpg and 1.jpg)
 */
export function getAllFreeExerciseDbImageUrls(exerciseId: string): string[] {
  const mapping = getExerciseMedia(exerciseId)
  if (!mapping?.freeExerciseDbId) return []

  return [
    `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${mapping.freeExerciseDbId}/0.jpg`,
    `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${mapping.freeExerciseDbId}/1.jpg`,
  ]
}

/**
 * Get media mapping stats
 */
export function getMediaMappingStats() {
  const total = exerciseMediaMappings.length
  const mapped = exerciseMediaMappings.filter((m) => m.status === 'mapped').length
  const partial = exerciseMediaMappings.filter((m) => m.status === 'partial').length
  const notFound = exerciseMediaMappings.filter((m) => m.status === 'not-found').length
  return { total, mapped, partial, notFound }
}

/**
 * Get all exercises that have a specific status
 */
export function getExercisesByMediaStatus(status: 'mapped' | 'partial' | 'not-found') {
  return exerciseMediaMappings.filter((m) => m.status === status)
}
