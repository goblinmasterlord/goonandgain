// Split types
export type SplitType = 'bro-split' | 'ppl'

// Coach avatar types
export type CoachAvatar = 'bebi' | 'marci'

// User types
export interface User {
  id: string
  createdAt: Date
  currentWeightKg: number
  gender: 'male' | 'female'
  birthYear?: number
  splitType: SplitType
  trainingDays: TrainingDays
  weightUpdatedAt: Date
  profileName?: string // Globally unique name for profile recovery
  coachAvatar?: CoachAvatar // Selected coach avatar for workout screens (default: bebi)
}

export interface TrainingDays {
  monday?: WorkoutType
  tuesday?: WorkoutType
  wednesday?: WorkoutType
  thursday?: WorkoutType
  friday?: WorkoutType
  saturday?: WorkoutType
  sunday?: WorkoutType
}

export type WorkoutType = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'push' | 'pull' | 'flex' | 'rest'

export interface WeightHistory {
  id?: number
  userId: string
  weightKg: number
  recordedAt: Date
}

// Exercise types
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
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'forearms'
  | 'traps'
  | 'rear_delts'
  | 'front_delts'
  | 'side_delts'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'ez_bar'

// Workout Template types
export interface WorkoutTemplate {
  id: string
  nameHu: string
  nameEn: string
  muscleFocus: WorkoutType
  exercises: TemplateExercise[]
}

export interface TemplateExercise {
  exerciseId: string
  order: number
  targetSets: number
  targetRepMin: number
  targetRepMax: number
  restSeconds: number
}

// Session types
export interface Session {
  id?: number
  userId: string
  templateId: string
  date: Date
  startedAt: Date
  completedAt?: Date
  notes?: string
}

export interface SetLog {
  id?: number
  sessionId: number
  exerciseId: string
  setNumber: number
  weightKg: number
  addedWeightKg?: number
  reps: number
  rir: RIR
  isMaxAttempt?: boolean // Heavy single/max attempt - excluded from progression algorithm
  loggedAt: Date
}

// RIR 0 = true failure (couldn't do another rep)
// RIR 1 = could do 1 more
// RIR 2 = ideal training intensity
// RIR 3 = too easy, increase weight
// RIR 4+ = way too easy
export type RIR = 0 | 1 | 2 | 3 | 4

// AI types
export interface AIFeedback {
  id?: number
  userId: string
  type: 'post_workout' | 'weekly' | 'alert' | 'on_demand'
  content: string
  dataSnapshot: string
  createdAt: Date
}

// Strength tracking
export interface EstimatedMax {
  id?: number
  userId: string
  exerciseId: string
  estimated1RM: number
  calculatedAt: Date
}

export type StrengthLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export interface StrengthStandard {
  squat: number
  bench: number
  deadlift: number
  ohp: number
}

export const STRENGTH_STANDARDS: Record<StrengthLevel, StrengthStandard> = {
  beginner: { squat: 1.0, bench: 0.75, deadlift: 1.25, ohp: 0.5 },
  intermediate: { squat: 1.5, bench: 1.2, deadlift: 2.0, ohp: 0.8 },
  advanced: { squat: 2.0, bench: 1.5, deadlift: 2.5, ohp: 1.0 },
  elite: { squat: 2.5, bench: 1.8, deadlift: 3.0, ohp: 1.2 },
}
