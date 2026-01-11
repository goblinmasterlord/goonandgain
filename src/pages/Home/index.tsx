import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getTemplateTotalSets,
  getTemplateEstimatedDuration,
  getAvailableTemplatesBySplit,
} from '@/data'
import {
  getRecentSessions,
  getSetsInDateRange,
  getWeekStart,
  getUser,
  getCustomTemplates,
  getCustomTemplatesForDay,
} from '@/lib/db'
import type { WorkoutTemplate, SplitType, CustomTemplate } from '@/types'

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

// Muscle icons (simple SVG paths)
const MUSCLE_ICONS: Record<string, React.ReactNode> = {
  chest: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4C8 4 4 6 4 10c0 2 1 4 2 5l1 5c0 1 1 2 2 2h6c1 0 2-1 2-2l1-5c1-1 2-3 2-5 0-4-4-6-8-6z" />
    </svg>
  ),
  back: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9 2 7 4 7 7v2c-2 0-3 1-3 3v6c0 2 1 4 3 4h10c2 0 3-2 3-4v-6c0-2-1-3-3-3V7c0-3-2-5-5-5zm0 2c2 0 3 1 3 3v2H9V7c0-2 1-3 3-3z" />
    </svg>
  ),
  shoulders: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4a4 4 0 00-4 4v2H4v6c0 2 2 4 4 4h8c2 0 4-2 4-4v-6h-4V8a4 4 0 00-4-4z" />
    </svg>
  ),
  arms: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 4v16h4v-6h2v6h4V4h-4v6h-2V4H5z" />
    </svg>
  ),
  legs: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 2v8l-2 10h4l1-8 1 8h4l-2-10V2H9z" />
    </svg>
  ),
  push: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 12h12l-4-4m4 4l-4 4M20 12h-4" />
      <path d="M4 12c0 0 2-4 8-4s8 4 8 4" strokeWidth="2" stroke="currentColor" fill="none" />
    </svg>
  ),
  pull: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 12H8l4-4m-4 4l4 4M4 12h4" />
      <path d="M20 12c0 0-2 4-8 4s-8-4-8-4" strokeWidth="2" stroke="currentColor" fill="none" />
    </svg>
  ),
  flex: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    </svg>
  ),
}

export function HomePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [hasWorkoutHistory, setHasWorkoutHistory] = useState(false)
  const [splitType, setSplitType] = useState<SplitType>('bro-split')
  const [availableTemplates, setAvailableTemplates] = useState<WorkoutTemplate[]>([])
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [weeklyStats, setWeeklyStats] = useState({
    sessionsThisWeek: 0,
    totalSetsThisWeek: 0,
  })

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Get user's split type
        const user = await getUser()
        const userSplitType = user?.splitType || 'bro-split'
        setSplitType(userSplitType)

        // Get templates for user's split type
        const templates = getAvailableTemplatesBySplit(userSplitType)
        setAvailableTemplates(templates)

        // Get custom templates for today (or all if none assigned)
        // JS: 0=Sunday, 1=Monday ... but our DB uses 0=Monday
        const jsDay = new Date().getDay()
        const ourDay = jsDay === 0 ? 6 : jsDay - 1 // Convert to 0=Mon format
        const todayCustom = await getCustomTemplatesForDay(ourDay)
        // Also get templates with no day assignment (available any day)
        const allCustom = await getCustomTemplates()
        const noAssignment = allCustom.filter(t => t.assignedDays.length === 0)
        // Merge and deduplicate
        const uniqueCustom = [...todayCustom]
        noAssignment.forEach(t => {
          if (!uniqueCustom.some(c => c.id === t.id)) {
            uniqueCustom.push(t)
          }
        })
        setCustomTemplates(uniqueCustom)

        // Get recent sessions to determine if user has history
        const sessions = await getRecentSessions(10)
        setHasWorkoutHistory(sessions.length > 0)

        // Get this week's stats
        const weekStart = getWeekStart(new Date())
        const weekEnd = new Date()
        const setsThisWeek = await getSetsInDateRange(weekStart, weekEnd)

        // Count unique sessions this week
        const sessionIds = new Set(setsThisWeek.map(s => s.sessionId))

        setWeeklyStats({
          sessionsThisWeek: sessionIds.size,
          totalSetsThisWeek: setsThisWeek.length,
        })
      } catch (error) {
        console.error('Error loading home data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Betöltés...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Header */}
      <header className="relative px-4 pt-6 pb-4 border-b-2 border-text-muted/20">
        <div className="flex items-start justify-between">
          <Link to="/" className="block">
            <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted mb-0.5">
              EDZÉSTERVEZŐ
            </p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              <span className="text-text-primary">GOON</span>
              <span className="text-accent">&</span>
              <span className="text-text-primary">GAIN</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            {/* Current split type badge */}
            <Link
              to="/settings"
              className="px-2 py-1 bg-bg-secondary border border-text-muted/30 hover:border-accent transition-colors"
            >
              <span className="text-2xs font-display uppercase tracking-wider text-accent">
                {splitType === 'ppl' ? 'PPL' : 'BRO'}
              </span>
            </Link>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 border border-text-muted/30 text-text-muted hover:border-accent hover:text-accent transition-colors"
              aria-label="Beállítások"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="square" strokeLinejoin="miter" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {hasWorkoutHistory ? (
        <ActiveUserView
          weeklyStats={weeklyStats}
          availableTemplates={availableTemplates}
          customTemplates={customTemplates}
        />
      ) : (
        <EmptyState availableTemplates={availableTemplates} customTemplates={customTemplates} />
      )}
    </div>
  )
}

// Empty state for new users
function EmptyState({ availableTemplates, customTemplates }: { availableTemplates: WorkoutTemplate[]; customTemplates: CustomTemplate[] }) {
  return (
    <div className="px-4 py-6">
      {/* Welcome message with Coach Bebi */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-6"
      >
        <img
          src="/bebi-avatar.png"
          alt="Coach Bebi"
          className="w-24 h-24 object-contain mx-auto mb-3"
        />
        <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-text-primary mb-1">
          VÁGJUNK BELE!
        </h2>
        <p className="text-text-secondary text-sm">
          Válassz egy edzéstervet és kezdjük el a munkát!
        </p>
      </motion.div>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="section-header">
            <span className="section-title">SAJÁT EDZÉSEK</span>
          </div>

          {customTemplates.map((template, index) => (
            <CustomTemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>
      )}

      {/* Template cards */}
      <div className="space-y-3">
        <div className="section-header">
          <span className="section-title">EDZÉSTERVEK</span>
        </div>

        {availableTemplates.map((template, index) => (
          <TemplateCard key={template.id} template={template} index={index} />
        ))}
      </div>

      {/* Exercise library link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-text-muted/20"
      >
        <Link
          to="/exercises"
          className="flex items-center justify-between p-3 bg-bg-secondary border border-text-muted/20 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-bg-elevated text-text-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-text-primary uppercase">
                GYAKORLATOK
              </p>
              <p className="text-xs text-text-muted">
                Böngéssz a gyakorlatok között
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </div>
  )
}

// Template card component
function TemplateCard({ template, index }: { template: WorkoutTemplate; index: number }) {
  const color = MUSCLE_COLORS[template.muscleFocus] || '#8a8a8a'
  const icon = MUSCLE_ICONS[template.muscleFocus]
  const sets = getTemplateTotalSets(template)
  const duration = getTemplateEstimatedDuration(template)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Link
        to={`/workout?template=${template.id}`}
        className="block bg-bg-secondary border-2 border-text-muted/20 hover:border-accent transition-colors overflow-hidden"
      >
        <div className="flex items-stretch">
          {/* Color stripe */}
          <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />

          {/* Content */}
          <div className="flex-1 p-4 flex items-center gap-4">
            {/* Icon */}
            <div
              className="w-12 h-12 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
                {template.nameHu}
              </h3>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-text-muted font-mono">
                  {template.exercises.length} gyakorlat
                </span>
                <span className="text-xs text-text-muted font-mono">
                  ~{sets} sorozat
                </span>
                <span className="text-xs text-text-muted font-mono">
                  ~{duration} perc
                </span>
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Custom template card component
function CustomTemplateCard({ template, index }: { template: CustomTemplate; index: number }) {
  const color = MUSCLE_COLORS[template.muscleFocus] || '#8a8a8a'
  const icon = MUSCLE_ICONS[template.muscleFocus]
  const totalSets = template.exercises.reduce((sum, ex) => sum + ex.targetSets, 0)
  // Estimate duration: ~3 min per set including rest
  const estimatedDuration = Math.round(totalSets * 3)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Link
        to={`/workout?template=custom-${template.id}`}
        className="block bg-bg-secondary border-2 border-text-muted/20 hover:border-accent transition-colors overflow-hidden"
      >
        <div className="flex items-stretch">
          {/* Color stripe */}
          <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />

          {/* Content */}
          <div className="flex-1 p-4 flex items-center gap-4">
            {/* Icon */}
            <div
              className="w-12 h-12 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {icon || (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary truncate">
                  {template.nameHu}
                </h3>
                <span className="px-1.5 py-0.5 text-2xs font-display uppercase tracking-wider bg-accent/20 text-accent flex-shrink-0">
                  SAJÁT
                </span>
              </div>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-text-muted font-mono">
                  {template.exercises.length} gyakorlat
                </span>
                <span className="text-xs text-text-muted font-mono">
                  ~{totalSets} sorozat
                </span>
                <span className="text-xs text-text-muted font-mono">
                  ~{estimatedDuration} perc
                </span>
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// View for users with workout history
function ActiveUserView({
  weeklyStats,
  availableTemplates,
  customTemplates,
}: {
  weeklyStats: { sessionsThisWeek: number; totalSetsThisWeek: number }
  availableTemplates: WorkoutTemplate[]
  customTemplates: CustomTemplate[]
}) {
  return (
    <>
      {/* Weekly Stats */}
      <section className="px-4 py-5">
        <div className="section-header">
          <span className="section-title">EZ A HÉT</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="stat-block">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-bold text-accent">
                {weeklyStats.sessionsThisWeek}
              </span>
            </div>
            <p className="stat-label">EDZÉS</p>
          </div>

          <div className="stat-block">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-bold text-text-primary">
                {weeklyStats.totalSetsThisWeek}
              </span>
            </div>
            <p className="stat-label">SOROZAT</p>
          </div>
        </div>
      </section>

      {/* Custom Templates section */}
      {customTemplates.length > 0 && (
        <section className="px-4 py-4">
          <div className="section-header">
            <span className="section-title">SAJÁT EDZÉSEK</span>
          </div>

          <div className="space-y-2">
            {customTemplates.map((template, index) => (
              <CustomTemplateCard key={template.id} template={template} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Workout selection */}
      <section className="px-4 py-4">
        <div className="section-header">
          <span className="section-title">EDZÉSTERVEK</span>
        </div>

        <div className="space-y-2">
          {availableTemplates.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="px-4 py-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/history"
            className="p-4 bg-bg-secondary border border-text-muted/20 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-2xs font-display uppercase tracking-wider text-text-muted">
                ELŐZMÉNYEK
              </span>
            </div>
            <p className="text-sm text-text-secondary">Korábbi edzések</p>
          </Link>

          <Link
            to="/progress"
            className="p-4 bg-bg-secondary border border-text-muted/20 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-2xs font-display uppercase tracking-wider text-text-muted">
                HALADÁS
              </span>
            </div>
            <p className="text-sm text-text-secondary">Volumen és erő</p>
          </Link>
        </div>
      </section>
    </>
  )
}
