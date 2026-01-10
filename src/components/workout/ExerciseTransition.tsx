import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutStore } from '@/stores'
import { getExerciseById, muscleGroups } from '@/data'
import { Button } from '@/components/ui'

// Coach Bebi exercise completion messages
const COMPLETION_MESSAGES = {
  // Excellent performance (RIR 1-2)
  excellent: [
    {
      text: 'BRUTÁLIS VOLT! 🦍',
      subtext: 'Így kell ezt csinálni, NINCS MEGÁLLÁS!',
    },
    {
      text: 'NA ILYET AKAROK LÁTNI!',
      subtext: 'Ez volt az a munka, ami számít. TOVÁBB!',
    },
    {
      text: 'BEAST MODE! 💪',
      subtext: 'Ezt a tempót tartsd, és KINÉZEL majd a pólóból!',
    },
  ],
  // Too easy performance (RIR 3-4)
  tooEasy: [
    {
      text: 'EZ TÚLSÁGOSAN KÖNNYŰ VOLT! 😤',
      subtext: 'Legközelebb PAKOLJ FEL SÚLYT! Nem pihenőnapra jöttél!',
    },
    {
      text: 'MI EZ, BEMELEGÍTÉS?',
      subtext: 'Több van benned, ne spórold ki! +5kg MINIMUM!',
    },
    {
      text: 'GYENGE! 🙄',
      subtext: 'De jó hír: a következő gyakorlat esélyt ad a javításra!',
    },
  ],
  // Early finish (skipped sets)
  earlyFinish: [
    {
      text: 'NA ÉS A TÖBBI?! 😠',
      subtext: 'Fele munka, fele eredmény. KÖVETKEZŐNÉL VÉGIG!',
    },
    {
      text: 'FELADTAD?!',
      subtext: 'Oké, de ígérd meg, hogy a következő gyakorlatot LETOLOD!',
    },
    {
      text: 'HMM... 🤨',
      subtext: 'Remélem, jó okod volt rá. A következőnél nincs mese!',
    },
  ],
}

function getRandomMessage(category: keyof typeof COMPLETION_MESSAGES) {
  const messages = COMPLETION_MESSAGES[category]
  return messages[Math.floor(Math.random() * messages.length)]
}

function analyzePerformance(
  sets: { rir: number }[],
  wasEarlyFinish: boolean
): keyof typeof COMPLETION_MESSAGES {
  if (wasEarlyFinish) return 'earlyFinish'
  if (sets.length === 0) return 'earlyFinish'

  const avgRir = sets.reduce((sum, s) => sum + s.rir, 0) / sets.length
  return avgRir >= 3 ? 'tooEasy' : 'excellent'
}

// Get Bebi avatar based on mood
function getBebiMood(category: keyof typeof COMPLETION_MESSAGES): string {
  switch (category) {
    case 'excellent':
      return '/bebi-proud.png'
    case 'tooEasy':
      return '/bebi-disappointed.png'
    case 'earlyFinish':
      return '/bebi-angry.png'
    default:
      return '/bebi-avatar.png'
  }
}

export function ExerciseTransition() {
  const {
    showExerciseTransition,
    transitionData,
    template,
    currentExerciseIndex,
    dismissExerciseTransition,
  } = useWorkoutStore()

  const [message, setMessage] = useState<{ text: string; subtext: string } | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  // Set message when transition shows + prevent body scroll
  useEffect(() => {
    if (showExerciseTransition && transitionData) {
      const category = analyzePerformance(
        transitionData.completedExerciseSets,
        transitionData.wasEarlyFinish
      )
      setMessage(getRandomMessage(category))

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [showExerciseTransition, transitionData])

  if (!showExerciseTransition || !transitionData || !template) return null

  const completedExercise = getExerciseById(transitionData.completedExerciseId)
  const nextExercise = transitionData.nextExerciseId
    ? getExerciseById(transitionData.nextExerciseId)
    : null
  const nextTemplateExercise = template.exercises[currentExerciseIndex + 1]

  const nextMuscle = nextExercise
    ? muscleGroups.find((m) => m.id === nextExercise.muscleGroupPrimary)
    : null

  // Calculate stats for completed exercise
  const totalReps = transitionData.completedExerciseSets.reduce((sum, s) => sum + s.reps, 0)
  const totalWeight = transitionData.completedExerciseSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
  const setsCompleted = transitionData.completedExerciseSets.length
  const topSet = transitionData.completedExerciseSets.length > 0
    ? transitionData.completedExerciseSets.reduce((best, s) =>
        s.weightKg * s.reps > best.weightKg * best.reps ? s : best,
        transitionData.completedExerciseSets[0]
      )
    : null

  const performanceCategory = analyzePerformance(
    transitionData.completedExerciseSets,
    transitionData.wasEarlyFinish
  )

  const handleContinue = async () => {
    setIsExiting(true)
    // Small delay for exit animation
    setTimeout(() => {
      dismissExerciseTransition()
      setIsExiting(false)
    }, 200)
  }

  return (
    <AnimatePresence>
      {showExerciseTransition && !isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-bg-primary z-[60] flex flex-col"
        >
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Top section - Completed exercise stats */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="px-4 pt-6 pb-4 border-b border-text-muted/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                    performanceCategory === 'excellent'
                      ? 'bg-accent'
                      : performanceCategory === 'tooEasy'
                        ? 'bg-warning'
                        : 'bg-danger'
                  }`}
                >
                  {performanceCategory === 'excellent' ? (
                    <svg className="w-5 h-5 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : performanceCategory === 'tooEasy' ? (
                    <span className="text-bg-primary text-lg font-bold">?</span>
                  ) : (
                    <svg className="w-5 h-5 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xs font-display uppercase tracking-wider text-text-muted">Kész</p>
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary truncate">
                    {completedExercise?.nameHu}
                  </h2>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-bg-secondary border border-accent p-2 text-center">
                  <p className="font-mono text-xl font-bold text-accent">{setsCompleted}</p>
                  <p className="text-2xs text-text-muted">sorozat</p>
                </div>
                <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                  <p className="font-mono text-xl font-bold text-text-primary">{totalReps}</p>
                  <p className="text-2xs text-text-muted">rep</p>
                </div>
                <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                  <p className="font-mono text-xl font-bold text-text-primary">
                    {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)}k` : totalWeight}
                  </p>
                  <p className="text-2xs text-text-muted">kg össz</p>
                </div>
                {topSet && (
                  <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                    <p className="font-mono text-xl font-bold text-text-primary">{topSet.weightKg}</p>
                    <p className="text-2xs text-text-muted">kg top</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Middle section - Coach Bebi */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex flex-col items-center justify-center px-4 py-4"
            >
              {/* Coach Bebi avatar */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ delay: 0.4, duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="mb-2"
              >
                <img
                  src={getBebiMood(performanceCategory)}
                  alt="Coach Bebi"
                  className="w-36 h-36 object-contain"
                />
              </motion.div>

              {/* Message */}
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.2 }}
                className="font-display text-lg font-extrabold uppercase tracking-wide text-text-primary mb-1 leading-tight text-center"
              >
                {message?.text}
              </motion.h1>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.2 }}
                className="text-text-secondary text-sm text-center max-w-xs"
              >
                {message?.subtext}
              </motion.p>

              {/* Fun fact */}
              {totalWeight > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-3 px-3 py-1.5 bg-bg-secondary border border-text-muted/10"
                >
                  <p className="text-xs text-text-muted text-center">
                    💡 <span className="text-accent font-mono font-bold">{totalWeight}</span> kg összterhelés
                    {totalWeight >= 1000 && ' – egy tonna!'}
                    {totalWeight >= 500 && totalWeight < 1000 && ' – fél tonna!'}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Bottom section - Next exercise preview + button (FIXED) */}
          {nextExercise && nextTemplateExercise && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex-shrink-0 px-4 pt-4 pb-6 border-t border-text-muted/20 bg-bg-secondary"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-1.5 h-12"
                  style={{ backgroundColor: nextMuscle?.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-2xs font-display uppercase tracking-wider text-accent mb-0.5">Következik</p>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary truncate">
                    {nextExercise.nameHu}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {nextTemplateExercise.targetSets}×{nextTemplateExercise.targetRepMin}-{nextTemplateExercise.targetRepMax} rep
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xl font-bold text-text-primary">
                    {currentExerciseIndex + 2}<span className="text-text-muted text-sm">/{template.exercises.length}</span>
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleContinue}
              >
                TOVÁBB 💪
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
