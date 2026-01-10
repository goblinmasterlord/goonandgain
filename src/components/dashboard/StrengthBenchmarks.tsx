import { useState, useEffect } from 'react'
import { getUser, getLatestEstimatedMax } from '@/lib/db'
import {
  BENCHMARK_LIFTS,
  calculateBenchmark,
  getLevelColor,
  getLevelNameHu,
  type BenchmarkLiftKey,
  type StrengthBenchmark,
} from '@/lib/workout'

export function StrengthBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<StrengthBenchmark[]>([])
  const [bodyweight, setBodyweight] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBenchmarks()
  }, [])

  const loadBenchmarks = async () => {
    setIsLoading(true)
    try {
      const user = await getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      setBodyweight(user.currentWeightKg)

      // Load 1RM for each benchmark lift
      const liftKeys = Object.keys(BENCHMARK_LIFTS) as BenchmarkLiftKey[]
      const benchmarkData = await Promise.all(
        liftKeys.map(async (key) => {
          const lift = BENCHMARK_LIFTS[key]
          const estimated1RM = await getLatestEstimatedMax(lift.id)
          return calculateBenchmark(key, estimated1RM, user.currentWeightKg)
        })
      )

      setBenchmarks(benchmarkData)
    } catch (error) {
      console.error('Failed to load benchmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  const hasBenchmarks = benchmarks.some((b) => b.estimated1RM !== null)

  return (
    <div className="space-y-4">
      {/* Header with bodyweight */}
      <div className="flex items-center justify-between">
        <span className="text-2xs font-display uppercase tracking-wider text-text-muted">
          Testsúly
        </span>
        <span className="font-mono text-lg text-text-primary">
          {bodyweight} <span className="text-text-muted text-sm">kg</span>
        </span>
      </div>

      {!hasBenchmarks ? (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm">
            Még nincs elég adatod az erőszint meghatározásához.
          </p>
          <p className="text-text-muted/70 text-2xs mt-2">
            Végezz edzéseket a fő gyakorlatokkal (guggolás, fekvenyomás, felhúzás, vállból nyomás)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {benchmarks.map((benchmark) => (
            <BenchmarkCard key={benchmark.liftKey} benchmark={benchmark} />
          ))}
        </div>
      )}
    </div>
  )
}

interface BenchmarkCardProps {
  benchmark: StrengthBenchmark
}

function BenchmarkCard({ benchmark }: BenchmarkCardProps) {
  const levelColor = getLevelColor(benchmark.currentLevel)
  const hasData = benchmark.estimated1RM !== null

  return (
    <div className="p-4 bg-bg-secondary border border-text-muted/20">
      {/* Lift name and level */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-bold text-text-primary uppercase tracking-wide">
          {benchmark.nameHu}
        </h4>
        {benchmark.currentLevel && (
          <span
            className="px-2 py-0.5 text-2xs font-display uppercase tracking-wider"
            style={{ backgroundColor: levelColor, color: '#050505' }}
          >
            {getLevelNameHu(benchmark.currentLevel)}
          </span>
        )}
      </div>

      {hasData ? (
        <>
          {/* 1RM and ratio */}
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-2xl font-bold text-accent">
              {benchmark.estimated1RM}
              <span className="text-text-muted text-sm ml-1">kg</span>
            </span>
            <span className="font-mono text-lg text-text-secondary">
              ({benchmark.bodyweightRatio}x BW)
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-bg-elevated relative mb-2">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${benchmark.progressToNextLevel}%`,
                backgroundColor: levelColor,
              }}
            />
          </div>

          {/* Next level info */}
          {benchmark.nextLevel && benchmark.targetForNextLevel && (
            <p className="text-2xs text-text-muted">
              <span className="text-text-secondary">{getLevelNameHu(benchmark.nextLevel)}</span>
              {' '}szinthez:{' '}
              <span className="font-mono text-accent">{benchmark.targetForNextLevel} kg</span>
              {' '}szükséges
            </p>
          )}

          {!benchmark.nextLevel && (
            <p className="text-2xs text-text-muted">
              Elit szint elérve! Gratulálunk!
            </p>
          )}
        </>
      ) : (
        <p className="text-text-muted/70 text-sm">
          Nincs adat - végezz legalább egy edzést ezzel a gyakorlattal
        </p>
      )}
    </div>
  )
}
