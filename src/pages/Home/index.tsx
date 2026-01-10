import { Button } from '@/components/ui'
import { Link } from 'react-router-dom'
import { chestDayTemplate, getTemplateTotalSets, getTemplateEstimatedDuration } from '@/data'

export function HomePage() {
  // For now, we'll use the chest day template
  // TODO: Load based on user's training schedule
  const template = chestDayTemplate

  const todayWorkout = {
    type: template.muscleFocus,
    nameHu: template.nameHu.toUpperCase(),
    exercises: template.exercises.length,
    sets: getTemplateTotalSets(template),
    duration: getTemplateEstimatedDuration(template),
    templateId: template.id,
    isRestDay: false,
  }

  const weekProgress = {
    completed: 3,
    total: 5,
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Header */}
      <header className="relative px-5 pt-8 pb-6 border-b-2 border-text-muted/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xs font-display uppercase tracking-[0.3em] text-text-muted mb-1">
              SZEMÉLYES EDZÉSTERVEZŐ
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              <span className="text-text-primary">GOON</span>
              <span className="text-accent">&</span>
              <span className="text-text-primary">GAIN</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted">HÉT</p>
            <p className="font-mono text-2xl font-bold text-accent">02</p>
          </div>
        </div>
      </header>

      {/* Today's Workout - Main CTA */}
      <section className="px-5 py-6">
        <div className="relative bg-bg-secondary border-2 border-text-muted/30 overflow-hidden">
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 bottom-0 w-2 bg-muscle-chest" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid opacity-50" />

          <div className="relative p-6 pl-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-2xs font-display uppercase tracking-[0.3em] text-text-muted mb-2">
                  MAI EDZÉS
                </p>
                <h2 className="font-display text-3xl font-extrabold text-text-primary tracking-wide">
                  {todayWorkout.nameHu}
                </h2>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 border border-muscle-chest text-muscle-chest">
                  <span className="font-mono text-xs">CHEST</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 mb-6">
              <div>
                <p className="font-mono text-3xl font-bold text-text-primary">{todayWorkout.exercises}</p>
                <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted">GYAKORLAT</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-bold text-text-primary">~{todayWorkout.sets}</p>
                <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted">SOROZAT</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-bold text-text-primary">{todayWorkout.duration}</p>
                <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted">PERC</p>
              </div>
            </div>

            {/* CTA */}
            <Link to={`/workout?template=${todayWorkout.templateId}`}>
              <Button size="lg" className="w-full shadow-harsh hover:shadow-harsh-lg">
                EDZÉS INDÍTÁSA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Weekly Progress */}
      <section className="px-5 py-4">
        <div className="section-header">
          <span className="section-title">HETI ÁTTEKINTÉS</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Completed workouts */}
          <div className="stat-block">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold text-accent">{weekProgress.completed}</span>
              <span className="text-text-muted font-mono text-lg">/{weekProgress.total}</span>
            </div>
            <p className="stat-label">TELJESÍTETT</p>
          </div>

          {/* Streak */}
          <div className="stat-block">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold text-success">12</span>
              <span className="text-text-muted font-mono text-lg">nap</span>
            </div>
            <p className="stat-label">SOROZAT</p>
          </div>
        </div>
      </section>

      {/* Week Schedule */}
      <section className="px-5 py-4">
        <div className="section-header">
          <span className="section-title">EZ A HÉT</span>
        </div>

        <div className="space-y-2">
          {[
            { day: 'H', name: 'MELL', done: true, color: 'bg-muscle-chest' },
            { day: 'K', name: 'HÁT', done: true, color: 'bg-muscle-back' },
            { day: 'SZ', name: 'VÁLL', done: true, color: 'bg-muscle-shoulders' },
            { day: 'CS', name: 'KAR', done: false, today: true, color: 'bg-muscle-arms' },
            { day: 'P', name: 'LÁB', done: false, color: 'bg-muscle-legs' },
            { day: 'SZO', name: 'FLEX', done: false, color: 'bg-text-muted' },
            { day: 'V', name: 'PIHENŐ', done: false, color: 'bg-bg-elevated' },
          ].map((item, i) => (
            <div
              key={i}
              className={`
                flex items-center gap-4 p-3 border transition-all duration-100
                ${item.today
                  ? 'border-accent bg-accent/5'
                  : item.done
                    ? 'border-text-muted/20 bg-bg-secondary'
                    : 'border-text-muted/10'
                }
              `}
            >
              <span className="font-mono text-sm text-text-muted w-8">{item.day}</span>
              <div className={`w-1 h-6 ${item.color}`} />
              <span className={`
                font-display text-sm tracking-wider flex-1
                ${item.done ? 'text-text-muted line-through' : item.today ? 'text-accent font-semibold' : 'text-text-secondary'}
              `}>
                {item.name}
              </span>
              {item.done && (
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {item.today && (
                <span className="text-2xs font-display uppercase tracking-wider text-accent animate-pulse-accent">
                  MA
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  )
}
