import { useParams, useNavigate, Link } from 'react-router-dom'
import { getExerciseById, muscleGroups, equipmentTypes } from '@/data'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exercise = id ? getExerciseById(id) : undefined

  if (!exercise) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted font-display uppercase tracking-wider mb-4">
            Gyakorlat nem található
          </p>
          <Button variant="secondary" onClick={() => navigate('/exercises')}>
            Vissza a listához
          </Button>
        </div>
      </div>
    )
  }

  const primaryMuscle = muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)
  const equipment = equipmentTypes.find((e) => e.id === exercise.equipment)

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Header with back button */}
      <header className="px-5 pt-6 pb-4 border-b-2 border-text-muted/20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-4"
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

        <div className="flex items-start gap-4">
          {/* Muscle color indicator */}
          <div
            className="w-2 h-16 flex-shrink-0 mt-1"
            style={{ backgroundColor: primaryMuscle?.color }}
          />
          <div className="flex-1">
            <p className="text-2xs font-display uppercase tracking-[0.3em] text-text-muted mb-1">
              {primaryMuscle?.nameHu}
            </p>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-text-primary">
              {exercise.nameHu}
            </h1>
            <p className="text-text-muted text-sm mt-1">{exercise.nameEn}</p>
          </div>
        </div>
      </header>

      {/* Quick stats */}
      <div className="px-5 py-4 border-b border-text-muted/10 bg-bg-secondary/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-1">
              Típus
            </p>
            <p
              className={cn(
                'font-display font-semibold text-sm uppercase',
                exercise.type === 'compound' ? 'text-accent' : 'text-text-secondary'
              )}
            >
              {exercise.type === 'compound' ? 'Összetett' : 'Izolált'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-1">
              Eszköz
            </p>
            <p className="font-display font-semibold text-sm text-text-primary">
              {equipment?.nameHu}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-1">
              Ism. tartomány
            </p>
            <p className="font-mono font-bold text-lg text-accent">
              {exercise.defaultRepRangeMin}-{exercise.defaultRepRangeMax}
            </p>
          </div>
        </div>
      </div>

      {/* Muscles worked */}
      <section className="px-5 py-6 border-b border-text-muted/10">
        <div className="section-header">
          <span className="section-title">Megdolgozott izmok</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Primary */}
          <div
            className="px-3 py-2 border-2 flex items-center gap-2"
            style={{ borderColor: primaryMuscle?.color }}
          >
            <span
              className="w-2 h-2"
              style={{ backgroundColor: primaryMuscle?.color }}
            />
            <span
              className="font-display text-sm uppercase tracking-wider"
              style={{ color: primaryMuscle?.color }}
            >
              {primaryMuscle?.nameHu}
            </span>
            <span className="text-2xs text-text-muted">(fő)</span>
          </div>

          {/* Secondary */}
          {exercise.muscleGroupsSecondary.map((muscleId) => {
            const muscle = muscleGroups.find((m) => m.id === muscleId)
            return (
              <div
                key={muscleId}
                className="px-3 py-2 border border-text-muted/30 flex items-center gap-2"
              >
                <span className="font-display text-sm uppercase tracking-wider text-text-secondary">
                  {muscle?.nameHu || muscleId}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Instructions */}
      <section className="px-5 py-6 border-b border-text-muted/10">
        <div className="section-header">
          <span className="section-title">Végrehajtás</span>
        </div>
        <div className="space-y-3">
          {exercise.instructionsHu.map((instruction, index) => (
            <div key={index} className="flex gap-4">
              <span className="font-mono text-accent font-bold text-lg w-6 flex-shrink-0">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <p className="text-text-secondary leading-relaxed">{instruction}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mistakes to avoid */}
      <section className="px-5 py-6 border-b border-text-muted/10">
        <div className="section-header">
          <span className="section-title">Gyakori hibák</span>
        </div>
        <div className="space-y-3">
          {exercise.mistakesToAvoidHu.map((mistake, index) => (
            <div key={index} className="flex gap-3 items-start">
              <svg
                className="w-5 h-5 text-danger flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-text-secondary leading-relaxed">{mistake}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alternatives */}
      {exercise.alternativeExerciseIds.length > 0 && (
        <section className="px-5 py-6">
          <div className="section-header">
            <span className="section-title">Alternatívák</span>
          </div>
          <div className="space-y-2">
            {exercise.alternativeExerciseIds.map((altId) => {
              const altExercise = getExerciseById(altId)
              if (!altExercise) return null

              const altMuscle = muscleGroups.find(
                (m) => m.id === altExercise.muscleGroupPrimary
              )

              return (
                <Link
                  key={altId}
                  to={`/exercises/${altId}`}
                  className="block p-4 border border-text-muted/20 bg-bg-secondary hover:border-accent/50 transition-all flex items-center gap-4 group"
                >
                  <div
                    className="w-1 h-8"
                    style={{ backgroundColor: altMuscle?.color }}
                  />
                  <div className="flex-1">
                    <p className="font-display font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {altExercise.nameHu}
                    </p>
                    <p className="text-2xs text-text-muted uppercase tracking-wider">
                      {equipmentTypes.find((e) => e.id === altExercise.equipment)?.nameHu}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="square" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
