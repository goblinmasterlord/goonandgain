import { create } from 'zustand'
import type { WorkoutTemplate, TemplateExercise, SetLog, RIR } from '@/types'
import {
  createSession,
  completeSession,
  logSet as dbLogSet,
  getSetLogsForSession,
  getLastSetLogsForExercise,
  isCustomTemplateId,
  getCustomTemplateNumericId,
  getCustomTemplateById,
  customTemplateToWorkoutTemplate,
} from '@/lib/db'
import { getTemplateById } from '@/data'

interface WorkoutState {
  // Session state
  sessionId: number | null
  template: WorkoutTemplate | null
  isActive: boolean
  startedAt: Date | null

  // Current exercise tracking
  currentExerciseIndex: number
  currentSetNumber: number
  completedSets: SetLog[]

  // Transition screens
  showExerciseTransition: boolean
  transitionData: {
    completedExerciseId: string
    completedExerciseSets: SetLog[]
    nextExerciseId: string | null
    wasEarlyFinish: boolean  // true if skipped sets
  } | null
  showWorkoutSummary: boolean

  // Rest timer
  isResting: boolean
  restTimeRemaining: number
  restTimerInterval: ReturnType<typeof setInterval> | null

  // Input state
  weightInput: string
  repsInput: string
  rirInput: RIR | null
  addedWeightInput: string

  // Last session data for current exercise
  lastSessionSets: SetLog[]

  // Actions
  startWorkout: (templateId: string) => Promise<void>
  endWorkout: (notes?: string) => Promise<void>
  logCurrentSet: () => Promise<void>
  skipSet: () => void
  nextExercise: () => void
  previousExercise: () => void
  swapExercise: (newExerciseId: string) => void

  // Input setters
  setWeight: (weight: string) => void
  setReps: (reps: string) => void
  setRir: (rir: RIR) => void
  setAddedWeight: (weight: string) => void

  // Rest timer
  startRestTimer: (seconds: number) => void
  stopRestTimer: () => void

  // Load last session data
  loadLastSessionData: (exerciseId: string) => Promise<void>

  // Transition actions
  dismissExerciseTransition: () => Promise<void>
  dismissWorkoutSummary: () => void

  // Reset
  reset: () => void

  // Get current exercise
  getCurrentExercise: () => TemplateExercise | null
}

const initialState = {
  sessionId: null,
  template: null,
  isActive: false,
  startedAt: null,
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  completedSets: [],
  showExerciseTransition: false,
  transitionData: null,
  showWorkoutSummary: false,
  isResting: false,
  restTimeRemaining: 0,
  restTimerInterval: null,
  weightInput: '',
  repsInput: '',
  rirInput: null,
  addedWeightInput: '',
  lastSessionSets: [],
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...initialState,

  startWorkout: async (templateId: string) => {
    let template: WorkoutTemplate | null = null

    // Check if this is a custom template
    if (isCustomTemplateId(templateId)) {
      const numericId = getCustomTemplateNumericId(templateId)
      if (numericId) {
        const customTemplate = await getCustomTemplateById(numericId)
        if (customTemplate) {
          template = customTemplateToWorkoutTemplate(customTemplate)
        }
      }
    } else {
      const regularTemplate = getTemplateById(templateId)
      if (regularTemplate) {
        template = regularTemplate
      }
    }

    if (!template) throw new Error('Template not found')

    const sessionId = await createSession(templateId)

    set({
      sessionId,
      template,
      isActive: true,
      startedAt: new Date(),
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      weightInput: '',
      repsInput: '',
      rirInput: null,
      addedWeightInput: '',
    })

    // Load last session data for first exercise
    if (template.exercises.length > 0) {
      await get().loadLastSessionData(template.exercises[0].exerciseId)
    }
  },

  endWorkout: async (notes?: string) => {
    const { sessionId, restTimerInterval } = get()
    if (sessionId) {
      await completeSession(sessionId, notes)
    }
    if (restTimerInterval) {
      clearInterval(restTimerInterval)
    }
    set({ ...initialState })
  },

  logCurrentSet: async () => {
    const {
      sessionId,
      template,
      currentExerciseIndex,
      currentSetNumber,
      weightInput,
      repsInput,
      rirInput,
      addedWeightInput,
    } = get()

    if (!sessionId || !template || !rirInput) return

    const exercise = template.exercises[currentExerciseIndex]
    if (!exercise) return

    const weight = parseFloat(weightInput) || 0
    const reps = parseInt(repsInput) || 0
    const addedWeight = addedWeightInput ? parseFloat(addedWeightInput) : undefined

    await dbLogSet(sessionId, exercise.exerciseId, currentSetNumber, weight, reps, rirInput, addedWeight)

    // Refresh completed sets
    const completedSets = await getSetLogsForSession(sessionId)

    // Check if we should move to next exercise
    if (currentSetNumber >= exercise.targetSets) {
      // Exercise complete - show transition screen
      const nextIndex = currentExerciseIndex + 1
      const nextExerciseId = nextIndex < template.exercises.length
        ? template.exercises[nextIndex].exerciseId
        : null

      // Get sets for the completed exercise
      const exerciseSets = completedSets.filter(s => s.exerciseId === exercise.exerciseId)

      if (nextExerciseId) {
        // Show exercise transition screen
        set({
          completedSets,
          showExerciseTransition: true,
          transitionData: {
            completedExerciseId: exercise.exerciseId,
            completedExerciseSets: exerciseSets,
            nextExerciseId,
            wasEarlyFinish: false,
          },
        })
      } else {
        // Workout complete - show summary
        set({
          completedSets,
          showWorkoutSummary: true,
          transitionData: {
            completedExerciseId: exercise.exerciseId,
            completedExerciseSets: exerciseSets,
            nextExerciseId: null,
            wasEarlyFinish: false,
          },
        })
      }
    } else {
      // Move to next set
      set({
        currentSetNumber: currentSetNumber + 1,
        completedSets,
        repsInput: '',
        rirInput: null,
      })
    }

    // Start rest timer
    get().startRestTimer(exercise.restSeconds)
  },

  skipSet: () => {
    const { template, currentExerciseIndex, currentSetNumber, completedSets, sessionId } = get()
    if (!template) return

    const exercise = template.exercises[currentExerciseIndex]
    if (!exercise) return

    if (currentSetNumber >= exercise.targetSets) {
      // Exercise complete (with skips) - show transition
      const nextIndex = currentExerciseIndex + 1
      const nextExerciseId = nextIndex < template.exercises.length
        ? template.exercises[nextIndex].exerciseId
        : null

      const exerciseSets = completedSets.filter(s => s.exerciseId === exercise.exerciseId && s.sessionId === sessionId)

      if (nextExerciseId) {
        set({
          showExerciseTransition: true,
          transitionData: {
            completedExerciseId: exercise.exerciseId,
            completedExerciseSets: exerciseSets,
            nextExerciseId,
            wasEarlyFinish: exerciseSets.length < exercise.targetSets,
          },
        })
      } else {
        set({
          showWorkoutSummary: true,
          transitionData: {
            completedExerciseId: exercise.exerciseId,
            completedExerciseSets: exerciseSets,
            nextExerciseId: null,
            wasEarlyFinish: exerciseSets.length < exercise.targetSets,
          },
        })
      }
    } else {
      set({ currentSetNumber: currentSetNumber + 1 })
    }
  },

  nextExercise: async () => {
    const { template, currentExerciseIndex } = get()
    if (!template) return

    const nextIndex = currentExerciseIndex + 1
    if (nextIndex < template.exercises.length) {
      set({
        currentExerciseIndex: nextIndex,
        currentSetNumber: 1,
        weightInput: '',
        repsInput: '',
        rirInput: null,
        addedWeightInput: '',
      })
      await get().loadLastSessionData(template.exercises[nextIndex].exerciseId)
    }
  },

  previousExercise: async () => {
    const { template, currentExerciseIndex } = get()
    if (!template) return

    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1
      set({
        currentExerciseIndex: prevIndex,
        currentSetNumber: 1,
        weightInput: '',
        repsInput: '',
        rirInput: null,
        addedWeightInput: '',
      })
      await get().loadLastSessionData(template.exercises[prevIndex].exerciseId)
    }
  },

  swapExercise: (newExerciseId: string) => {
    const { template, currentExerciseIndex } = get()
    if (!template) return

    const newExercises = [...template.exercises]
    newExercises[currentExerciseIndex] = {
      ...newExercises[currentExerciseIndex],
      exerciseId: newExerciseId,
    }

    set({
      template: { ...template, exercises: newExercises },
      currentSetNumber: 1,
      weightInput: '',
      repsInput: '',
      rirInput: null,
      addedWeightInput: '',
    })

    get().loadLastSessionData(newExerciseId)
  },

  setWeight: (weight: string) => set({ weightInput: weight }),
  setReps: (reps: string) => set({ repsInput: reps }),
  setRir: (rir: RIR) => set({ rirInput: rir }),
  setAddedWeight: (weight: string) => set({ addedWeightInput: weight }),

  startRestTimer: (seconds: number) => {
    const { restTimerInterval } = get()
    if (restTimerInterval) {
      clearInterval(restTimerInterval)
    }

    set({ isResting: true, restTimeRemaining: seconds })

    const interval = setInterval(() => {
      const { restTimeRemaining } = get()
      if (restTimeRemaining <= 1) {
        clearInterval(interval)
        set({ isResting: false, restTimeRemaining: 0, restTimerInterval: null })
        // Could trigger vibration/sound here
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }
      } else {
        set({ restTimeRemaining: restTimeRemaining - 1 })
      }
    }, 1000)

    set({ restTimerInterval: interval })
  },

  stopRestTimer: () => {
    const { restTimerInterval } = get()
    if (restTimerInterval) {
      clearInterval(restTimerInterval)
    }
    set({ isResting: false, restTimeRemaining: 0, restTimerInterval: null })
  },

  loadLastSessionData: async (exerciseId: string) => {
    const { sessionId } = get()
    const lastSets = await getLastSetLogsForExercise(exerciseId, sessionId ?? undefined)
    set({ lastSessionSets: lastSets })

    // Pre-fill weight from last session if available
    if (lastSets.length > 0) {
      set({ weightInput: lastSets[0].weightKg.toString() })
    }
  },

  dismissExerciseTransition: async () => {
    const { template, currentExerciseIndex, transitionData } = get()
    if (!template || !transitionData?.nextExerciseId) return

    // Move to next exercise
    const nextIndex = currentExerciseIndex + 1
    if (nextIndex < template.exercises.length) {
      set({
        currentExerciseIndex: nextIndex,
        currentSetNumber: 1,
        showExerciseTransition: false,
        transitionData: null,
        weightInput: '',
        repsInput: '',
        rirInput: null,
        addedWeightInput: '',
      })
      // Load last session data for new exercise
      await get().loadLastSessionData(template.exercises[nextIndex].exerciseId)
    }
  },

  dismissWorkoutSummary: () => {
    set({
      showWorkoutSummary: false,
      transitionData: null,
    })
  },

  reset: () => {
    const { restTimerInterval } = get()
    if (restTimerInterval) {
      clearInterval(restTimerInterval)
    }
    set({ ...initialState })
  },

  getCurrentExercise: () => {
    const { template, currentExerciseIndex } = get()
    if (!template) return null
    return template.exercises[currentExerciseIndex] || null
  },
}))
