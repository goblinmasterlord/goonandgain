import Dexie, { Table } from 'dexie'
import type {
  User,
  WeightHistory,
  Exercise,
  WorkoutTemplate,
  Session,
  SetLog,
  AIFeedback,
  EstimatedMax,
  RIR,
  SplitType,
  TrainingDays,
  CustomTemplate,
  TemplateExercise,
  WorkoutType,
} from '@/types'
import type { SyncQueueItem } from '@/lib/sync/types'

export class GoonAndGainDB extends Dexie {
  users!: Table<User, string>
  weightHistory!: Table<WeightHistory, number>
  exercises!: Table<Exercise, string>
  workoutTemplates!: Table<WorkoutTemplate, string>
  sessions!: Table<Session, number>
  setLogs!: Table<SetLog, number>
  aiFeedback!: Table<AIFeedback, number>
  estimatedMaxes!: Table<EstimatedMax, number>
  syncQueue!: Table<SyncQueueItem, number>
  customTemplates!: Table<CustomTemplate, number>

  constructor() {
    super('GoonAndGainDB')

    this.version(1).stores({
      users: 'id, createdAt',
      weightHistory: '++id, userId, recordedAt',
      exercises: 'id, muscleGroupPrimary, equipment, type',
      workoutTemplates: 'id, muscleFocus',
      sessions: '++id, userId, templateId, date, startedAt',
      setLogs: '++id, sessionId, exerciseId, loggedAt',
      aiFeedback: '++id, userId, type, createdAt',
      estimatedMaxes: '++id, userId, exerciseId, calculatedAt',
    })

    // Version 2: Add sync queue for Supabase sync
    this.version(2).stores({
      users: 'id, createdAt',
      weightHistory: '++id, userId, recordedAt',
      exercises: 'id, muscleGroupPrimary, equipment, type',
      workoutTemplates: 'id, muscleFocus',
      sessions: '++id, userId, templateId, date, startedAt',
      setLogs: '++id, sessionId, exerciseId, loggedAt',
      aiFeedback: '++id, userId, type, createdAt',
      estimatedMaxes: '++id, userId, exerciseId, calculatedAt',
      syncQueue: '++id, table, action, syncedAt, createdAt',
    })

    // Version 3: Add custom templates for user-created workouts
    this.version(3).stores({
      users: 'id, createdAt',
      weightHistory: '++id, userId, recordedAt',
      exercises: 'id, muscleGroupPrimary, equipment, type',
      workoutTemplates: 'id, muscleFocus',
      sessions: '++id, userId, templateId, date, startedAt',
      setLogs: '++id, sessionId, exerciseId, loggedAt',
      aiFeedback: '++id, userId, type, createdAt',
      estimatedMaxes: '++id, userId, exerciseId, calculatedAt',
      syncQueue: '++id, table, action, syncedAt, createdAt',
      customTemplates: '++id, odbc, userId, muscleFocus, createdAt',
    })
  }
}

export const db = new GoonAndGainDB()

// Helper to check if user exists
export async function hasUser(): Promise<boolean> {
  const count = await db.users.count()
  return count > 0
}

// Get current user
export async function getUser(): Promise<User | undefined> {
  const user = await db.users.toCollection().first()
  if (user && !user.splitType) {
    // Default to bro-split for existing users who don't have splitType set
    user.splitType = 'bro-split'
  }
  return user
}

// Update user's split type and training days
export async function updateUserSplit(
  splitType: SplitType,
  trainingDays: TrainingDays
): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('No user found')

  await db.users.update(user.id, {
    splitType,
    trainingDays,
  })
}

// Session helpers
export async function createSession(templateId: string): Promise<number> {
  const user = await getUser()
  if (!user) throw new Error('No user found')

  const session: Session = {
    userId: user.id,
    templateId,
    date: new Date(),
    startedAt: new Date(),
  }
  return await db.sessions.add(session)
}

export async function completeSession(sessionId: number, notes?: string): Promise<void> {
  await db.sessions.update(sessionId, {
    completedAt: new Date(),
    notes,
  })
}

export async function getActiveSession(): Promise<Session | undefined> {
  const user = await getUser()
  if (!user) return undefined

  // Find session without completedAt
  return await db.sessions
    .where('userId')
    .equals(user.id)
    .filter((s) => !s.completedAt)
    .first()
}

export async function getSessionById(id: number): Promise<Session | undefined> {
  return await db.sessions.get(id)
}

// Set log helpers
export async function logSet(
  sessionId: number,
  exerciseId: string,
  setNumber: number,
  weightKg: number,
  reps: number,
  rir: RIR,
  addedWeightKg?: number
): Promise<number> {
  const setLog: SetLog = {
    sessionId,
    exerciseId,
    setNumber,
    weightKg,
    reps,
    rir,
    addedWeightKg,
    loggedAt: new Date(),
  }
  return await db.setLogs.add(setLog)
}

export async function getSetLogsForSession(sessionId: number): Promise<SetLog[]> {
  return await db.setLogs.where('sessionId').equals(sessionId).toArray()
}

export async function getLastSetLogsForExercise(
  exerciseId: string,
  excludeSessionId?: number
): Promise<SetLog[]> {
  const user = await getUser()
  if (!user) return []

  // Get recent sessions for this user (sorted newest first)
  const sessions = await db.sessions
    .where('userId')
    .equals(user.id)
    .filter((s) => s.completedAt !== undefined && (!excludeSessionId || s.id !== excludeSessionId))
    .toArray()
    .then((results) => results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

  if (sessions.length === 0) return []

  // Get set logs from the most recent session that has this exercise
  for (const session of sessions) {
    const logs = await db.setLogs
      .where('sessionId')
      .equals(session.id!)
      .filter((log) => log.exerciseId === exerciseId)
      .sortBy('setNumber')

    if (logs.length > 0) return logs
  }

  return []
}

export async function deleteSetLog(id: number): Promise<void> {
  await db.setLogs.delete(id)
}

export async function updateSetLog(
  id: number,
  updates: {
    weightKg?: number
    reps?: number
    rir?: RIR
    addedWeightKg?: number
    isMaxAttempt?: boolean
  }
): Promise<void> {
  await db.setLogs.update(id, updates)
}

export async function getSetLogById(id: number): Promise<SetLog | undefined> {
  return await db.setLogs.get(id)
}

export async function getRecentSessions(limit: number = 10): Promise<Session[]> {
  const user = await getUser()
  if (!user) return []

  return await db.sessions
    .where('userId')
    .equals(user.id)
    .filter((s) => s.completedAt !== undefined)
    .toArray()
    .then((sessions) =>
      sessions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
    )
}

// Get session with all its set logs
export interface SessionWithSets extends Session {
  sets: SetLog[]
}

export async function getSessionWithSets(sessionId: number): Promise<SessionWithSets | undefined> {
  const session = await db.sessions.get(sessionId)
  if (!session) return undefined

  const sets = await db.setLogs
    .where('sessionId')
    .equals(sessionId)
    .sortBy('loggedAt')

  return { ...session, sets }
}

// Get all sessions with their set counts (for history list)
export interface SessionSummary extends Session {
  totalSets: number
  exerciseCount: number
}

export async function getRecentSessionSummaries(limit: number = 20): Promise<SessionSummary[]> {
  const sessions = await getRecentSessions(limit)

  const summaries: SessionSummary[] = await Promise.all(
    sessions.map(async (session) => {
      const sets = await db.setLogs
        .where('sessionId')
        .equals(session.id!)
        .toArray()

      const uniqueExercises = new Set(sets.map((s) => s.exerciseId))

      return {
        ...session,
        totalSets: sets.length,
        exerciseCount: uniqueExercises.size,
      }
    })
  )

  return summaries
}

// Volume tracking helpers
export interface WeeklyVolume {
  muscleGroup: string
  sets: number
  avgRir: number
}

export async function getWeeklyVolume(weekStartDate: Date): Promise<WeeklyVolume[]> {
  const user = await getUser()
  if (!user) return []

  const weekEnd = new Date(weekStartDate)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Get all sessions in this week
  const sessions = await db.sessions
    .where('userId')
    .equals(user.id)
    .filter(
      (s) =>
        s.completedAt !== undefined &&
        new Date(s.date) >= weekStartDate &&
        new Date(s.date) < weekEnd
    )
    .toArray()

  if (sessions.length === 0) return []

  // Get all set logs for these sessions
  const allSets: SetLog[] = []
  for (const session of sessions) {
    const sets = await db.setLogs.where('sessionId').equals(session.id!).toArray()
    allSets.push(...sets)
  }

  // We need to map exercises to muscle groups
  // This requires importing exercise data, which we'll do in the component
  // For now, return raw set data grouped by exercise
  return []
}

// Get sets by exercise for a date range (used by Progress page)
export async function getSetsInDateRange(
  startDate: Date,
  endDate: Date
): Promise<SetLog[]> {
  const user = await getUser()
  if (!user) return []

  const sessions = await db.sessions
    .where('userId')
    .equals(user.id)
    .filter(
      (s) =>
        s.completedAt !== undefined &&
        new Date(s.date) >= startDate &&
        new Date(s.date) < endDate
    )
    .toArray()

  const allSets: SetLog[] = []
  for (const session of sessions) {
    const sets = await db.setLogs.where('sessionId').equals(session.id!).toArray()
    allSets.push(...sets)
  }

  return allSets
}

// Get start of current week (Monday)
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Estimated Max helpers
export async function saveEstimatedMax(
  exerciseId: string,
  estimated1RM: number
): Promise<number> {
  const user = await getUser()
  if (!user) throw new Error('No user found')

  return await db.estimatedMaxes.add({
    userId: user.id,
    exerciseId,
    estimated1RM,
    calculatedAt: new Date(),
  })
}

export async function getLatestEstimatedMax(exerciseId: string): Promise<number | null> {
  const user = await getUser()
  if (!user) return null

  const latest = await db.estimatedMaxes
    .where('exerciseId')
    .equals(exerciseId)
    .filter((e) => e.userId === user.id)
    .toArray()
    .then((results) =>
      results.sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())[0]
    )

  return latest?.estimated1RM ?? null
}

export async function getEstimatedMaxHistory(
  exerciseId: string,
  limit: number = 10
): Promise<EstimatedMax[]> {
  const user = await getUser()
  if (!user) return []

  return await db.estimatedMaxes
    .where('exerciseId')
    .equals(exerciseId)
    .filter((e) => e.userId === user.id)
    .toArray()
    .then((results) =>
      results
        .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())
        .slice(0, limit)
    )
}

// Delete session and all its set logs
export async function deleteSession(sessionId: number): Promise<{
  deletedSetIds: number[]
  session: Session | undefined
}> {
  // Get the session first for sync purposes
  const session = await db.sessions.get(sessionId)

  // Get all set logs for this session
  const sets = await db.setLogs.where('sessionId').equals(sessionId).toArray()
  const deletedSetIds = sets.map(s => s.id!).filter(Boolean)

  // Delete all set logs for this session
  await db.setLogs.where('sessionId').equals(sessionId).delete()

  // Delete the session itself
  await db.sessions.delete(sessionId)

  return { deletedSetIds, session }
}

// Get sessions count for a date range
export async function getSessionCountInDateRange(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const user = await getUser()
  if (!user) return 0

  const sessions = await db.sessions
    .where('userId')
    .equals(user.id)
    .filter(
      (s) =>
        s.completedAt !== undefined &&
        new Date(s.date) >= startDate &&
        new Date(s.date) < endDate
    )
    .toArray()

  return sessions.length
}

// Get total weight lifted in a date range
export async function getTotalWeightInDateRange(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const sets = await getSetsInDateRange(startDate, endDate)
  return sets.reduce((total, set) => total + (set.weightKg * set.reps), 0)
}

// Get personal records (highest weight for each exercise)
export interface PersonalRecord {
  exerciseId: string
  weightKg: number
  reps: number
  date: Date
  sessionId: number
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const user = await getUser()
  if (!user) return []

  // Get all completed sessions
  const sessions = await db.sessions
    .where('userId')
    .equals(user.id)
    .filter((s) => s.completedAt !== undefined)
    .toArray()

  if (sessions.length === 0) return []

  // Get all set logs
  const allSets: (SetLog & { date: Date })[] = []
  for (const session of sessions) {
    const sets = await db.setLogs.where('sessionId').equals(session.id!).toArray()
    sets.forEach(set => {
      allSets.push({ ...set, date: session.date })
    })
  }

  // Group by exercise and find max weight for each
  const prMap = new Map<string, PersonalRecord>()

  allSets.forEach(set => {
    const existing = prMap.get(set.exerciseId)
    if (!existing || set.weightKg > existing.weightKg) {
      prMap.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        date: set.date,
        sessionId: set.sessionId,
      })
    }
  })

  return Array.from(prMap.values())
}

// Get recent PRs (PRs set within a date range)
export async function getRecentPRs(
  startDate: Date,
  endDate: Date
): Promise<PersonalRecord[]> {
  const allPRs = await getPersonalRecords()

  return allPRs.filter(pr => {
    const prDate = new Date(pr.date)
    return prDate >= startDate && prDate < endDate
  })
}

// ============================================
// Custom Template CRUD Functions
// ============================================

// Create a new custom template
export async function createCustomTemplate(
  nameHu: string,
  muscleFocus: WorkoutType,
  exercises: TemplateExercise[],
  assignedDays: number[] = []
): Promise<number> {
  const user = await getUser()
  if (!user) throw new Error('No user found')

  const template: CustomTemplate = {
    userId: user.id,
    nameHu,
    muscleFocus,
    exercises,
    assignedDays,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return await db.customTemplates.add(template)
}

// Get all custom templates for current user
export async function getCustomTemplates(): Promise<CustomTemplate[]> {
  const user = await getUser()
  if (!user) return []

  return await db.customTemplates
    .where('userId')
    .equals(user.id)
    .toArray()
    .then((results) =>
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    )
}

// Get a specific custom template by ID
export async function getCustomTemplateById(id: number): Promise<CustomTemplate | undefined> {
  return await db.customTemplates.get(id)
}

// Update a custom template
export async function updateCustomTemplate(
  id: number,
  updates: Partial<Pick<CustomTemplate, 'nameHu' | 'muscleFocus' | 'exercises' | 'assignedDays'>>
): Promise<void> {
  await db.customTemplates.update(id, {
    ...updates,
    updatedAt: new Date(),
  })
}

// Delete a custom template
export async function deleteCustomTemplate(id: number): Promise<void> {
  await db.customTemplates.delete(id)
}

// Get custom templates for a specific day (0=Mon, 6=Sun)
// Returns templates that are assigned to this day OR have no day assignment (flexible)
export async function getCustomTemplatesForDay(dayOfWeek: number): Promise<CustomTemplate[]> {
  const templates = await getCustomTemplates()
  return templates.filter(t =>
    t.assignedDays.length === 0 || t.assignedDays.includes(dayOfWeek)
  )
}

// Convert custom template to WorkoutTemplate format (for use with existing workout flow)
export function customTemplateToWorkoutTemplate(custom: CustomTemplate): WorkoutTemplate {
  return {
    id: `custom-${custom.id}`,
    nameHu: custom.nameHu,
    nameEn: custom.nameHu, // Use Hungarian name for both
    muscleFocus: custom.muscleFocus,
    exercises: custom.exercises,
  }
}

// Check if a template ID is a custom template
export function isCustomTemplateId(templateId: string): boolean {
  return templateId.startsWith('custom-')
}

// Extract the numeric ID from a custom template ID
export function getCustomTemplateNumericId(templateId: string): number | null {
  if (!isCustomTemplateId(templateId)) return null
  const numStr = templateId.replace('custom-', '')
  const num = parseInt(numStr, 10)
  return isNaN(num) ? null : num
}
