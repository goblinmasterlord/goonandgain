import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCustomTemplates, deleteCustomTemplate } from '@/lib/db'
import { queueSync, isSupabaseConfigured } from '@/lib/sync'
import { muscleGroups } from '@/data'
import { Button } from '@/components/ui'
import type { CustomTemplate, DayOfWeek } from '@/types'
import { DAY_ABBREV_HU } from '@/types'

// Muscle colors for template cards
const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ff4d00',
  back: '#0066ff',
  shoulders: '#9333ea',
  arms: '#ff0066',
  legs: '#00d4aa',
  push: '#f97316',
  pull: '#22d3ee',
  flex: '#8a8a8a',
}

export function CustomWorkoutsPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [templateToDelete, setTemplateToDelete] = useState<CustomTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await getCustomTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load custom templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete?.id) return

    setIsDeleting(true)
    try {
      const idToDelete = templateToDelete.id
      await deleteCustomTemplate(idToDelete)
      // Queue sync for delete
      if (isSupabaseConfigured()) {
        await queueSync('custom_templates', 'delete', idToDelete, {})
      }
      setTemplates((prev) => prev.filter((t) => t.id !== idToDelete))
      setTemplateToDelete(null)
    } catch (error) {
      console.error('Failed to delete template:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getTotalSets = (template: CustomTemplate): number => {
    return template.exercises.reduce((sum, ex) => sum + ex.targetSets, 0)
  }

  const getEstimatedDuration = (template: CustomTemplate): number => {
    let totalSeconds = 0
    template.exercises.forEach((ex) => {
      // Assume 45 seconds per set + rest time
      totalSeconds += ex.targetSets * (45 + ex.restSeconds)
    })
    return Math.round(totalSeconds / 60)
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b-2 border-text-muted/20">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-3"
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
          <span className="text-xs font-display uppercase tracking-wider">Vissza</span>
        </button>
        <h1 className="font-display text-xl font-extrabold uppercase tracking-wide">
          Egyéni edzések
        </h1>
        <p className="text-text-muted text-xs mt-0.5">
          Hozd létre a saját edzésterveidet
        </p>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {templates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                totalSets={getTotalSets(template)}
                duration={getEstimatedDuration(template)}
                onEdit={() => navigate(`/settings/custom-workouts/${template.id}`)}
                onDelete={() => setTemplateToDelete(template)}
              />
            ))}
          </div>
        )}

        {/* Create button */}
        <div className="mt-6">
          <Link to="/settings/custom-workouts/new">
            <Button variant="primary" className="w-full">
              + ÚJ EDZÉS LÉTREHOZÁSA
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {templateToDelete && (
        <DeleteConfirmationModal
          template={templateToDelete}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 border-2 border-text-muted/30 flex items-center justify-center mb-4 mx-auto">
        <svg
          className="w-8 h-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="square"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary mb-2">
        Még nincs egyéni edzésed
      </h2>
      <p className="text-text-muted text-sm mb-6">
        Hozd létre a saját edzésterveidet a gyakorlatok, sorozatok és ismétlések
        testreszabásával.
      </p>
    </div>
  )
}

interface TemplateCardProps {
  template: CustomTemplate
  index: number
  totalSets: number
  duration: number
  onEdit: () => void
  onDelete: () => void
}

function TemplateCard({
  template,
  index,
  totalSets,
  duration,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  const color = MUSCLE_COLORS[template.muscleFocus] || '#8a8a8a'
  const muscle = muscleGroups.find((m) => m.id === template.muscleFocus)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="bg-bg-secondary border border-text-muted/20 overflow-hidden"
    >
      <div className="flex items-stretch">
        {/* Color stripe */}
        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary truncate">
                {template.nameHu}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-2xs uppercase tracking-wider"
                  style={{ color }}
                >
                  {muscle?.nameHu}
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-2xs text-text-muted font-mono">
                  {template.exercises.length} gyakorlat
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-2 text-text-muted hover:text-accent transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="square"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-text-muted hover:text-danger transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-text-muted/10">
            <span className="text-xs text-text-muted font-mono">~{totalSets} sorozat</span>
            <span className="text-xs text-text-muted font-mono">~{duration} perc</span>
            {template.assignedDays.length > 0 && (
              <div className="flex items-center gap-1">
                {template.assignedDays.map((day) => (
                  <span
                    key={day}
                    className="text-2xs text-text-muted bg-bg-elevated px-1.5 py-0.5"
                  >
                    {DAY_ABBREV_HU[day as DayOfWeek]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface DeleteConfirmationModalProps {
  template: CustomTemplate
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationModal({
  template,
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
        <p className="text-text-primary text-center mb-4 font-semibold">
          {template.nameHu}
        </p>
        <p className="text-danger text-sm text-center mb-6 p-3 bg-danger/10 border border-danger/30">
          Ez a művelet nem visszavonható!
        </p>

        <div className="flex gap-4">
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={isDeleting}>
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
