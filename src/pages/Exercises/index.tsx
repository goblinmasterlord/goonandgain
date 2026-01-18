import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { allExercises, muscleGroups, equipmentTypes } from '@/data'
import { cn } from '@/lib/utils/cn'

type FilterType = 'all' | 'muscle' | 'equipment'

export function ExercisesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredExercises = useMemo(() => {
    let exercises = allExercises

    // Filter by muscle
    if (selectedMuscle) {
      exercises = exercises.filter(
        (e) =>
          e.muscleGroupPrimary === selectedMuscle ||
          e.muscleGroupsSecondary.includes(selectedMuscle as any)
      )
    }

    // Filter by equipment
    if (selectedEquipment) {
      exercises = exercises.filter((e) => e.equipment === selectedEquipment)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      exercises = exercises.filter(
        (e) =>
          e.nameHu.toLowerCase().includes(query) ||
          e.nameEn.toLowerCase().includes(query)
      )
    }

    return exercises
  }, [selectedMuscle, selectedEquipment, searchQuery])

  const clearFilters = () => {
    setSelectedMuscle(null)
    setSelectedEquipment(null)
    setSearchQuery('')
    setActiveFilter('all')
  }

  const getMuscleColor = (muscle: string) => {
    const group = muscleGroups.find((m) => m.id === muscle)
    return group?.color || '#4a4a4a'
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b-2 border-text-muted/20">
        <div className="px-4 py-3">
          <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted mb-0.5">
            KÖNYVTÁR
          </p>
          <h1 className="font-display text-lg font-extrabold uppercase tracking-wide">
            Gyakorlatok
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">
            {allExercises.length} gyakorlat
          </p>
        </div>
      </header>

      {/* Search */}
      <div className="px-5 py-4 border-b border-text-muted/10">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="square"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-elevated border-2 border-text-muted/20 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-3 border-b border-text-muted/10">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'MIND' },
            { id: 'muscle', label: 'IZOMCSOPORT' },
            { id: 'equipment', label: 'ESZKÖZ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id as FilterType)
                if (tab.id === 'all') clearFilters()
              }}
              className={cn(
                'px-4 py-2 text-xs font-display uppercase tracking-wider border-2 transition-all duration-100',
                activeFilter === tab.id
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-text-muted/20 text-text-secondary hover:border-text-muted/40'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Options */}
      {activeFilter === 'muscle' && (
        <div className="px-5 py-4 border-b border-text-muted/10 bg-bg-secondary/50">
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map((muscle) => (
              <button
                key={muscle.id}
                onClick={() =>
                  setSelectedMuscle(selectedMuscle === muscle.id ? null : muscle.id)
                }
                className={cn(
                  'px-3 py-1.5 text-xs font-display uppercase tracking-wider border transition-all duration-100 flex items-center gap-2',
                  selectedMuscle === muscle.id
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-text-muted/30 text-text-secondary hover:border-text-muted/50'
                )}
              >
                <span
                  className="w-2 h-2"
                  style={{ backgroundColor: muscle.color }}
                />
                {muscle.nameHu}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFilter === 'equipment' && (
        <div className="px-5 py-4 border-b border-text-muted/10 bg-bg-secondary/50">
          <div className="flex flex-wrap gap-2">
            {equipmentTypes.map((equip) => (
              <button
                key={equip.id}
                onClick={() =>
                  setSelectedEquipment(
                    selectedEquipment === equip.id ? null : equip.id
                  )
                }
                className={cn(
                  'px-3 py-1.5 text-xs font-display uppercase tracking-wider border transition-all duration-100',
                  selectedEquipment === equip.id
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-text-muted/30 text-text-secondary hover:border-text-muted/50'
                )}
              >
                {equip.nameHu}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(selectedMuscle || selectedEquipment || searchQuery) && (
        <div className="px-5 py-3 flex items-center justify-between bg-accent/5 border-b border-accent/20">
          <p className="text-xs text-text-secondary">
            <span className="font-mono text-accent">{filteredExercises.length}</span> találat
          </p>
          <button
            onClick={clearFilters}
            className="text-xs font-display uppercase tracking-wider text-accent hover:underline"
          >
            Szűrők törlése
          </button>
        </div>
      )}

      {/* Exercise List */}
      <div className="px-5 py-4">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted font-display uppercase tracking-wider">
              Nincs találat
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((exercise, index) => (
              <Link
                key={exercise.id}
                to={`/exercises/${exercise.id}`}
                className="block"
              >
                <div
                  className={cn(
                    'p-4 border border-text-muted/20 bg-bg-secondary',
                    'hover:border-accent/50 hover:bg-bg-elevated transition-all duration-100',
                    'flex items-center gap-4 group'
                  )}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {/* Muscle color indicator */}
                  <div
                    className="w-1 h-12 flex-shrink-0"
                    style={{ backgroundColor: getMuscleColor(exercise.muscleGroupPrimary) }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                      {exercise.nameHu}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xs font-display uppercase tracking-wider text-text-muted">
                        {muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary)?.nameHu}
                      </span>
                      <span className="text-text-muted/30">|</span>
                      <span className="text-2xs font-display uppercase tracking-wider text-text-muted">
                        {equipmentTypes.find((e) => e.id === exercise.equipment)?.nameHu}
                      </span>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div
                    className={cn(
                      'px-2 py-1 text-2xs font-display uppercase tracking-wider border',
                      exercise.type === 'compound'
                        ? 'border-accent/50 text-accent'
                        : 'border-text-muted/30 text-text-muted'
                    )}
                  >
                    {exercise.type === 'compound' ? 'Összetett' : 'Izolált'}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="square" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { ExerciseDetailPage } from './ExerciseDetail'
