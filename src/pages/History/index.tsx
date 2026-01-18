import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { hu } from 'date-fns/locale'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import {
  getRecentSessionSummaries,
  getSessionWithSets,
  deleteSession,
  type SessionSummary,
  type SessionWithSets,
} from '@/lib/db'
import { getTemplateById, getExerciseById, muscleGroups } from '@/data'
import { Button } from '@/components/ui'
import { SetEditModal } from '@/components/workout/SetEditModal'
import { queueSync, isSupabaseConfigured } from '@/lib/sync'
import { cn } from '@/lib/utils/cn'
import type { SetLog } from '@/types'

export function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<SessionWithSets | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<SessionSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const data = await getRecentSessionSummaries(50)
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openSessionDetail = async (sessionId: number) => {
    const session = await getSessionWithSets(sessionId)
    if (session) {
      setSelectedSession(session)
    }
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete?.id) return

    setIsDeleting(true)
    try {
      const { deletedSetIds, session } = await deleteSession(sessionToDelete.id)

      // Queue sync for deletions if Supabase is configured
      if (isSupabaseConfigured() && session) {
        // Queue set log deletions
        for (const setId of deletedSetIds) {
          await queueSync('set_logs', 'delete', setId, {})
        }
        // Queue session deletion
        await queueSync('sessions', 'delete', sessionToDelete.id, {})
      }

      // Update local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id))
      setSessionToDelete(null)
    } catch (error) {
      console.error('Failed to delete session:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getMuscleColor = (templateId: string): string => {
    const template = getTemplateById(templateId)
    if (!template) return '#8a8a8a'
    const muscle = muscleGroups.find((m) => m.id === template.muscleFocus)
    return muscle?.color || '#8a8a8a'
  }

  const getTemplateName = (templateId: string): string => {
    const template = getTemplateById(templateId)
    return template?.nameHu || templateId
  }

  const calculateDuration = (start: Date, end?: Date): number => {
    if (!end) return 0
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b-2 border-text-muted/20">
        <div className="px-4 py-3">
          <h1 className="font-display text-lg font-extrabold uppercase tracking-wide">
            Előzmények
          </h1>
          <p className="text-text-muted text-xs mt-0.5">
            {sessions.length > 0
              ? `${sessions.length} befejezett edzés`
              : 'Korábbi edzéseid itt jelennek meg'}
          </p>
        </div>
      </header>

      {/* Swipe hint */}
      {sessions.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <p className="text-2xs text-text-muted text-center">
            Húzd balra a törléshez
          </p>
        </div>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="px-5 py-2 space-y-3">
          {sessions.map((session) => (
            <SwipeableSessionCard
              key={session.id}
              session={session}
              onOpen={() => openSessionDetail(session.id!)}
              onDelete={() => setSessionToDelete(session)}
              getTemplateName={getTemplateName}
              getMuscleColor={getMuscleColor}
              calculateDuration={calculateDuration}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <DeleteConfirmationModal
          session={sessionToDelete}
          templateName={getTemplateName(sessionToDelete.templateId)}
          isDeleting={isDeleting}
          onConfirm={handleDeleteSession}
          onCancel={() => setSessionToDelete(null)}
        />
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-16 h-16 border-2 border-text-muted/30 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="square"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-2">
        Még nincs előzmény
      </h2>
      <p className="text-text-muted text-center mb-6">
        Befejezett edzéseid itt fognak megjelenni
      </p>
      <Link to="/">
        <Button variant="secondary">EDZÉS INDÍTÁSA</Button>
      </Link>
    </div>
  )
}

interface SwipeableSessionCardProps {
  session: SessionSummary
  onOpen: () => void
  onDelete: () => void
  getTemplateName: (templateId: string) => string
  getMuscleColor: (templateId: string) => string
  calculateDuration: (start: Date, end?: Date) => number
}

function SwipeableSessionCard({
  session,
  onOpen,
  onDelete,
  getTemplateName,
  getMuscleColor,
  calculateDuration,
}: SwipeableSessionCardProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0])
  const deleteScale = useTransform(x, [-100, -60], [1, 0.8])

  const duration = calculateDuration(session.startedAt, session.completedAt)
  const muscleColor = getMuscleColor(session.templateId)

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80) {
      onDelete()
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        className="absolute inset-y-0 right-0 w-24 bg-danger flex items-center justify-center"
        style={{ opacity: deleteOpacity, scale: deleteScale }}
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="square"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-bg-primary"
      >
        <button onClick={onOpen} className="w-full text-left">
          <div
            className={cn(
              'p-4 border border-text-muted/20 bg-bg-secondary',
              'hover:border-accent/50 transition-all duration-100',
              'flex items-stretch gap-4'
            )}
          >
            {/* Muscle color bar */}
            <div
              className="w-1 self-stretch"
              style={{ backgroundColor: muscleColor }}
            />

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-text-primary uppercase tracking-wide">
                    {getTemplateName(session.templateId)}
                  </h3>
                  <p className="text-2xs text-text-muted mt-1">
                    {format(new Date(session.date), 'yyyy. MMMM d.', { locale: hu })}
                    {' · '}
                    {formatDistanceToNow(new Date(session.date), {
                      addSuffix: true,
                      locale: hu,
                    })}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-accent">
                    {session.totalSets}
                  </p>
                  <p className="text-2xs text-text-muted uppercase tracking-wider">
                    sorozat
                  </p>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-text-muted/10">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm text-text-secondary">
                    {session.exerciseCount}
                  </span>
                  <span className="text-2xs text-text-muted">gyakorlat</span>
                </div>
                {duration > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-sm text-text-secondary">
                      {duration}
                    </span>
                    <span className="text-2xs text-text-muted">perc</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="square" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  )
}

interface DeleteConfirmationModalProps {
  session: SessionSummary
  templateName: string
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationModal({
  session,
  templateName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-bg-primary/95 z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-secondary border-2 border-danger/50 p-6 max-w-sm w-full"
      >
        {/* Warning icon */}
        <div className="w-14 h-14 bg-danger/20 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="square"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-center mb-2">
          Edzés törlése?
        </h2>
        <p className="text-text-muted text-center mb-2">
          <span className="font-semibold text-text-primary">{templateName}</span>
        </p>
        <p className="text-text-muted text-sm text-center mb-6">
          {format(new Date(session.date), 'yyyy. MMMM d.', { locale: hu })}
          {' · '}
          {session.totalSets} sorozat
        </p>

        <p className="text-danger text-sm text-center mb-6 p-3 bg-danger/10 border border-danger/30">
          Ez a művelet nem visszavonható! Az összes rögzített sorozat törlésre kerül.
        </p>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Mégse
          </Button>
          <Button
            variant="primary"
            className="flex-1 !bg-danger hover:!bg-danger/80"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Törlés...' : 'Törlés'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface SessionDetailModalProps {
  session: SessionWithSets
  onClose: () => void
  onSetUpdated?: (updatedSet: SetLog) => void
}

function SessionDetailModal({ session, onClose, onSetUpdated }: SessionDetailModalProps) {
  const [editingSet, setEditingSet] = useState<SetLog | null>(null)
  const [localSets, setLocalSets] = useState(session.sets)

  const template = getTemplateById(session.templateId)
  const muscleColor = template
    ? muscleGroups.find((m) => m.id === template.muscleFocus)?.color
    : '#8a8a8a'

  // Group sets by exercise
  const setsByExercise = localSets.reduce(
    (acc, set) => {
      if (!acc[set.exerciseId]) {
        acc[set.exerciseId] = []
      }
      acc[set.exerciseId].push(set)
      return acc
    },
    {} as Record<string, typeof localSets>
  )

  const duration = session.completedAt
    ? Math.round(
        (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
      )
    : 0

  const handleSetSaved = (updatedSet: SetLog) => {
    // Update local state
    setLocalSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s))
    setEditingSet(null)
    onSetUpdated?.(updatedSet)
  }

  return (
    <div className="fixed inset-0 bg-bg-primary z-50 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 bg-bg-primary border-b-2 border-text-muted/20 px-5 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-display uppercase tracking-wider">Vissza</span>
          </button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="w-2 h-12" style={{ backgroundColor: muscleColor }} />
          <div>
            <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">
              {template?.nameHu || session.templateId}
            </h1>
            <p className="text-text-muted text-sm">
              {format(new Date(session.date), 'yyyy. MMMM d. EEEE', { locale: hu })}
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-text-muted/10 bg-bg-secondary/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-mono text-2xl font-bold text-accent">{localSets.length}</p>
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
              Sorozat
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {Object.keys(setsByExercise).length}
            </p>
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted">
              Gyakorlat
            </p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-text-primary">{duration}</p>
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted">Perc</p>
          </div>
        </div>
      </div>

      {/* Edit hint */}
      <div className="px-5 py-2 bg-bg-elevated/50 border-b border-text-muted/10">
        <p className="text-2xs text-text-muted text-center">
          Koppints egy sorozatra a szerkesztéshez
        </p>
      </div>

      {/* Exercises */}
      <div className="px-5 py-4 pb-20">
        {Object.entries(setsByExercise).map(([exerciseId, sets]) => {
          const exercise = getExerciseById(exerciseId)
          const exerciseMuscle = exercise
            ? muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)
            : null

          return (
            <div key={exerciseId} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-1 h-6"
                  style={{ backgroundColor: exerciseMuscle?.color || '#8a8a8a' }}
                />
                <h3 className="font-display font-bold text-text-primary uppercase tracking-wide">
                  {exercise?.nameHu || exerciseId}
                </h3>
              </div>

              <div className="space-y-2">
                {sets.map((set, index) => (
                  <button
                    key={set.id}
                    onClick={() => setEditingSet(set)}
                    className="w-full flex items-center gap-4 p-3 bg-bg-secondary border border-text-muted/10 hover:border-accent/50 transition-colors"
                  >
                    <span className="font-mono text-lg text-text-muted w-8">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 flex items-center gap-4">
                      <span className="font-mono text-lg text-text-primary">
                        {set.weightKg}
                        <span className="text-text-muted text-sm">kg</span>
                      </span>
                      <span className="text-text-muted">×</span>
                      <span className="font-mono text-lg text-text-primary">
                        {set.reps}
                        <span className="text-text-muted text-sm">rep</span>
                      </span>
                    </div>
                    {set.isMaxAttempt && (
                      <span className="px-2 py-0.5 border border-warning/50 text-warning text-2xs font-display uppercase tracking-wider">
                        MAX
                      </span>
                    )}
                    <div
                      className={cn(
                        'px-2 py-1 border text-sm font-mono',
                        set.rir === 0
                          ? 'border-danger text-danger font-bold'
                          : set.rir === 1
                            ? 'border-danger/50 text-danger'
                            : set.rir === 2
                              ? 'border-accent/50 text-accent'
                              : 'border-text-muted/30 text-text-muted'
                      )}
                    >
                      RIR {set.rir === 4 ? '4+' : set.rir}
                    </div>
                    <svg
                      className="w-4 h-4 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="square" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Set Edit Modal */}
      {editingSet && (
        <SetEditModal
          set={editingSet}
          exerciseName={getExerciseById(editingSet.exerciseId)?.nameHu || editingSet.exerciseId}
          onClose={() => setEditingSet(null)}
          onSave={handleSetSaved}
        />
      )}
    </div>
  )
}
