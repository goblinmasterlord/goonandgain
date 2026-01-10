import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutStore } from '@/stores'
import { getExerciseById, muscleGroups } from '@/data'
import { Button } from '@/components/ui'

// Coach Bebi workout completion messages
const WORKOUT_MESSAGES = {
  // Beast mode - great workout
  beast: [
    {
      headline: 'BEAST MODE TELJESÍTVE!',
      text: 'Ez az! LETOLTAD! Az izmok majd KIREPÜLNEK a pólóból!',
      subtext: 'Most pedig ZABÁLJ és ALUDJ, mert a regeneráció az igazi varázslat!',
    },
    {
      headline: 'KIRÁLY VOLTÁL!',
      text: 'Na ILYEN edzést akarok látni MINDEN NAP!',
      subtext: 'A tested köszöni, az izmok NÖVEKEDNEK. Menj és pihenj meg!',
    },
    {
      headline: 'EZ VOLT AZ!',
      text: 'Letoltad a melót, nem panaszkodtál, DOLGOZTÁL!',
      subtext: 'Fehérje, víz, alvás - EZ A SZENTHÁROMSÁG!',
    },
  ],
  // Good workout
  good: [
    {
      headline: 'SZÉP MUNKA!',
      text: 'Megvolt az edzés! Nem tökéletes, de KI LETT TOLVA!',
      subtext: 'Legközelebb még többet adunk bele, de most pihenj!',
    },
    {
      headline: 'KÉSZ VAN!',
      text: 'Nem rossz! Becsületes munka volt!',
      subtext: 'De legközelebb NYOMJUNK RÁ JOBBAN, egyezett?',
    },
  ],
  // Meh workout (too easy or lots of skips)
  meh: [
    {
      headline: 'OOOKAY...',
      text: 'Megvolt, de ez NEM a legjobb formád volt!',
      subtext: 'Legközelebb KOMOLYABBAN vedd! De legalább bejöttél, ez is valami!',
    },
    {
      headline: 'LEHETETT VOLNA JOBB!',
      text: 'Nézd, bejöttél, ez már valami. De tudom, hogy TÖBB VAN BENNED!',
      subtext: 'A következő edzésen MUTASD MEG, mit tudsz igazán!',
    },
  ],
  // Short workout (few sets)
  short: [
    {
      headline: 'EZ MIND?',
      text: 'Na jó... ez egy kicsit RÖVID volt, nem gondolod?',
      subtext: 'Remélem, legközelebb VÉGIG csinálod! De oké, pihenj!',
    },
    {
      headline: 'HMM...',
      text: 'Mondjuk úgy, hogy volt már jobb is tőled!',
      subtext: 'De nem baj, mindenki rosszabb napon. HOLNAP VISSZAVÁGLAK!',
    },
  ],
}

function getRandomMessage(category: keyof typeof WORKOUT_MESSAGES) {
  const messages = WORKOUT_MESSAGES[category]
  return messages[Math.floor(Math.random() * messages.length)]
}

function analyzeWorkout(
  completedSets: { rir: number; weightKg: number; reps: number }[],
  totalExpectedSets: number
): keyof typeof WORKOUT_MESSAGES {
  const completionRate = completedSets.length / totalExpectedSets

  if (completionRate < 0.5) return 'short'
  if (completionRate < 0.75) return 'meh'

  const avgRir = completedSets.reduce((sum, s) => sum + s.rir, 0) / completedSets.length

  if (avgRir >= 3) return 'meh'
  if (avgRir <= 2 && completionRate >= 0.9) return 'beast'
  return 'good'
}

// Get Bebi avatar based on mood
function getBebiMood(category: keyof typeof WORKOUT_MESSAGES): string {
  switch (category) {
    case 'beast':
      return '/bebi-proud.png'
    case 'good':
      return '/bebi-avatar.png' // No happy image available, use default
    case 'meh':
      return '/bebi-disappointed.png'
    case 'short':
      return '/bebi-angry.png'
    default:
      return '/bebi-avatar.png'
  }
}

// Fun facts generator
function generateFunFacts(stats: {
  totalWeight: number
  totalReps: number
  duration: number
  totalSets: number
}): string[] {
  const facts: string[] = []

  // Weight-based facts
  if (stats.totalWeight >= 10000) {
    facts.push(`🏋️ ${(stats.totalWeight / 1000).toFixed(1)} tonna összterhelés! Egy autót emeltél meg!`)
  } else if (stats.totalWeight >= 5000) {
    facts.push(`🏋️ ${(stats.totalWeight / 1000).toFixed(1)} tonna! Egy motort emeltél meg!`)
  } else if (stats.totalWeight >= 2000) {
    facts.push(`🏋️ ${stats.totalWeight} kg összterhelés! Egy kis autó súlya!`)
  } else if (stats.totalWeight >= 1000) {
    facts.push(`🏋️ Több mint 1 TONNA összterhelés!`)
  }

  // Reps-based facts
  if (stats.totalReps >= 100) {
    facts.push(`💪 ${stats.totalReps} ismétlés! Az izmok ÉGNEK!`)
  } else if (stats.totalReps >= 50) {
    facts.push(`💪 ${stats.totalReps} rep letolva!`)
  }

  // Duration-based facts
  if (stats.duration >= 60) {
    facts.push(`⏱️ ${stats.duration} perces maratoni edzés!`)
  } else if (stats.duration >= 45) {
    facts.push(`⏱️ Közel egy óra kemény munka!`)
  }

  // Efficiency
  if (stats.totalSets > 0 && stats.duration > 0) {
    const setsPerMinute = stats.totalSets / stats.duration
    if (setsPerMinute >= 0.5) {
      facts.push(`⚡ Hatékony tempó: ${(stats.duration / stats.totalSets).toFixed(1)} perc/sorozat`)
    }
  }

  return facts.slice(0, 2) // Max 2 fun facts
}

export function WorkoutSummary() {
  const {
    showWorkoutSummary,
    template,
    completedSets,
    startedAt,
    dismissWorkoutSummary,
  } = useWorkoutStore()

  const [message, setMessage] = useState<{ headline: string; text: string; subtext: string } | null>(null)
  const [showStats, setShowStats] = useState(false)

  // Calculate totals
  const stats = useMemo(() => {
    if (!template) return null

    const totalExpectedSets = template.exercises.reduce((sum, e) => sum + e.targetSets, 0)
    const totalWeight = completedSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
    const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0)
    const duration = startedAt
      ? Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
      : 0

    // Group by exercise for display
    const exerciseStats = template.exercises.map((te) => {
      const exercise = getExerciseById(te.exerciseId)
      const sets = completedSets.filter((s) => s.exerciseId === te.exerciseId)
      const muscle = exercise ? muscleGroups.find((m) => m.id === exercise.muscleGroupPrimary) : null

      return {
        name: exercise?.nameHu || te.exerciseId,
        targetSets: te.targetSets,
        completedSets: sets.length,
        topSet: sets.length > 0
          ? sets.reduce((best, s) => (s.weightKg * s.reps > best.weightKg * best.reps ? s : best), sets[0])
          : null,
        color: muscle?.color || '#ff4d00',
      }
    })

    const funFacts = generateFunFacts({
      totalWeight,
      totalReps,
      duration,
      totalSets: completedSets.length,
    })

    return {
      totalSets: completedSets.length,
      totalExpectedSets,
      totalWeight,
      totalReps,
      duration,
      exerciseStats,
      funFacts,
    }
  }, [template, completedSets, startedAt])

  // Set message when summary shows + prevent body scroll
  useEffect(() => {
    if (showWorkoutSummary && stats) {
      const category = analyzeWorkout(completedSets, stats.totalExpectedSets)
      setMessage(getRandomMessage(category))

      // Stagger show stats
      setTimeout(() => setShowStats(true), 800)

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    } else {
      setShowStats(false)
    }
  }, [showWorkoutSummary, stats, completedSets])

  if (!showWorkoutSummary || !template || !stats) return null

  const performanceCategory = analyzeWorkout(completedSets, stats.totalExpectedSets)

  return (
    <AnimatePresence>
      {showWorkoutSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-bg-primary z-[60] flex flex-col"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Header with Bebi and headline */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="px-4 pt-4 pb-3 text-center"
            >
              {/* Coach Bebi avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-2"
              >
                <img
                  src={getBebiMood(performanceCategory)}
                  alt="Coach Bebi"
                  className="w-40 h-40 object-contain mx-auto"
                />
              </motion.div>

              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.2 }}
                className="font-display text-xl font-extrabold uppercase tracking-wide text-text-primary mb-1"
              >
                {message?.headline}
              </motion.h1>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.2 }}
                className="text-accent text-sm font-semibold"
              >
                {message?.text}
              </motion.p>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.2 }}
                className="text-text-muted text-xs"
              >
                {message?.subtext}
              </motion.p>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showStats ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pb-4"
            >
              <div className="grid grid-cols-4 gap-2 mb-3">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.2 }}
                  className="bg-bg-secondary border border-accent p-2 text-center"
                >
                  <p className="font-mono text-2xl font-bold text-accent">{stats.totalSets}</p>
                  <p className="text-2xs text-text-muted">/{stats.totalExpectedSets}</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.2 }}
                  className="bg-bg-secondary border border-text-muted/20 p-2 text-center"
                >
                  <p className="font-mono text-2xl font-bold text-text-primary">{stats.duration}</p>
                  <p className="text-2xs text-text-muted">perc</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.2 }}
                  className="bg-bg-secondary border border-text-muted/20 p-2 text-center"
                >
                  <p className="font-mono text-2xl font-bold text-text-primary">{stats.totalReps}</p>
                  <p className="text-2xs text-text-muted">rep</p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.65, duration: 0.2 }}
                  className="bg-bg-secondary border border-text-muted/20 p-2 text-center"
                >
                  <p className="font-mono text-2xl font-bold text-text-primary">
                    {stats.totalWeight >= 1000 ? `${(stats.totalWeight / 1000).toFixed(1)}k` : stats.totalWeight}
                  </p>
                  <p className="text-2xs text-text-muted">kg</p>
                </motion.div>
              </div>

              {/* Fun facts */}
              {stats.funFacts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showStats ? 1 : 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  className="space-y-1 mb-4"
                >
                  {stats.funFacts.map((fact, i) => (
                    <div key={i} className="px-3 py-2 bg-bg-secondary border border-text-muted/10">
                      <p className="text-xs text-text-secondary text-center">{fact}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Exercise breakdown */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: showStats ? 1 : 0 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="px-4 pb-4"
            >
              <h3 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-2">
                Gyakorlatok
              </h3>

              <div className="space-y-1.5">
                {stats.exerciseStats.map((ex, index) => (
                  <motion.div
                    key={ex.name}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.05, duration: 0.2 }}
                    className="flex items-center gap-2 p-2 bg-bg-secondary border border-text-muted/10"
                  >
                    <div className="w-1 h-8" style={{ backgroundColor: ex.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold text-text-primary truncate">
                        {ex.name}
                      </p>
                      {ex.topSet && (
                        <p className="text-xs text-text-muted font-mono">
                          {ex.topSet.weightKg}kg × {ex.topSet.reps}
                        </p>
                      )}
                    </div>
                    <p className={`font-mono text-base font-bold flex-shrink-0 ${
                      ex.completedSets >= ex.targetSets ? 'text-accent' : 'text-warning'
                    }`}>
                      {ex.completedSets}/{ex.targetSets}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Finish button (FIXED at bottom) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-text-muted/20 bg-bg-secondary"
          >
            <Button
              size="lg"
              className="w-full"
              onClick={dismissWorkoutSummary}
            >
              BEFEJEZÉS 🔥
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
