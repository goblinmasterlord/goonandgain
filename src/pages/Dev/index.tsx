import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { db, getUser } from '@/lib/db'
import { Button } from '@/components/ui'
import { chestDayTemplate, backDayTemplate } from '@/data/templates'
import type { RIR } from '@/types'

type LoadingDemo = 'none' | 'app' | 'spinner' | 'coach' | 'skeleton'
type TransitionDemo = 'none' | 'exercise-excellent' | 'exercise-easy' | 'exercise-skip' | 'summary-beast' | 'summary-meh' | 'summary-short'

// Transition screen preview data
const TRANSITION_DATA = {
  'exercise-excellent': {
    type: 'exercise',
    mood: 'excellent' as const,
    avatar: '/bebi-proud.png',
    headline: 'BRUTÁLIS VOLT!',
    subtext: 'Így kell ezt csinálni, NINCS MEGÁLLÁS!',
    exercise: 'Fekvenyomás',
    stats: { sets: 4, reps: 42, weight: 2800, top: 80 },
    nextExercise: 'Ferde pad',
  },
  'exercise-easy': {
    type: 'exercise',
    mood: 'tooEasy' as const,
    avatar: '/bebi-disappointed.png',
    headline: 'EZ TÚLSÁGOSAN KÖNNYŰ VOLT!',
    subtext: 'Legközelebb PAKOLJ FEL SÚLYT!',
    exercise: 'Kábel keresztezés',
    stats: { sets: 3, reps: 36, weight: 540, top: 20 },
    nextExercise: 'Fekvőtámasz',
  },
  'exercise-skip': {
    type: 'exercise',
    mood: 'earlyFinish' as const,
    avatar: '/bebi-angry.png',
    headline: 'NA ÉS A TÖBBI?!',
    subtext: 'Fele munka, fele eredmény. KÖVETKEZŐNÉL VÉGIG!',
    exercise: 'Tárogatás',
    stats: { sets: 2, reps: 16, weight: 720, top: 50 },
    nextExercise: 'Tricepsz nyújtás',
  },
  'summary-beast': {
    type: 'summary',
    mood: 'beast' as const,
    avatar: '/bebi-proud.png',
    headline: 'BEAST MODE TELJESÍTVE!',
    text: 'Ez az! LETOLTAD! Az izmok majd KIREPÜLNEK a pólóból!',
    subtext: 'Most pedig ZABÁLJ és ALUDJ!',
    stats: { sets: 24, expected: 26, duration: 58, reps: 248, weight: 8500 },
    exercises: [
      { name: 'Fekvenyomás', sets: 4, target: 4, top: '80kg × 8', color: '#ff4d00' },
      { name: 'Ferde pad', sets: 4, target: 4, top: '60kg × 10', color: '#ff4d00' },
      { name: 'Kábel keresztezés', sets: 3, target: 3, top: '20kg × 12', color: '#ff4d00' },
    ],
  },
  'summary-meh': {
    type: 'summary',
    mood: 'meh' as const,
    avatar: '/bebi-disappointed.png',
    headline: 'LEHETETT VOLNA JOBB!',
    text: 'Nézd, bejöttél, ez már valami. De tudom, hogy TÖBB VAN BENNED!',
    subtext: 'A következő edzésen MUTASD MEG, mit tudsz igazán!',
    stats: { sets: 18, expected: 26, duration: 42, reps: 180, weight: 4200 },
    exercises: [
      { name: 'Fekvenyomás', sets: 3, target: 4, top: '70kg × 6', color: '#ff4d00' },
      { name: 'Ferde pad', sets: 3, target: 4, top: '50kg × 8', color: '#ff4d00' },
    ],
  },
  'summary-short': {
    type: 'summary',
    mood: 'short' as const,
    avatar: '/bebi-angry.png',
    headline: 'EZ MIND?',
    text: 'Na jó... ez egy kicsit RÖVID volt, nem gondolod?',
    subtext: 'Remélem, legközelebb VÉGIG csinálod!',
    stats: { sets: 8, expected: 26, duration: 18, reps: 72, weight: 1800 },
    exercises: [
      { name: 'Fekvenyomás', sets: 2, target: 4, top: '60kg × 6', color: '#ff4d00' },
    ],
  },
}

export function DevPage() {
  const navigate = useNavigate()
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loadingDemo, setLoadingDemo] = useState<LoadingDemo>('none')
  const [transitionDemo, setTransitionDemo] = useState<TransitionDemo>('none')

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Reset all exercise data (sessions + set logs)
  const handleResetExerciseData = async () => {
    if (!confirm('Biztosan törlöd az összes edzés adatot? Ez nem vonható vissza!')) return

    setIsWorking(true)
    try {
      await db.setLogs.clear()
      await db.sessions.clear()
      await db.estimatedMaxes.clear()
      showMessage('success', 'Edzés adatok törölve!')
    } catch (error) {
      showMessage('error', `Hiba: ${error}`)
    } finally {
      setIsWorking(false)
    }
  }

  // Reset everything (full database wipe)
  const handleResetAll = async () => {
    if (!confirm('FIGYELEM: Ez törli az összes adatot, beleértve a profilt is! Folytatod?')) return

    setIsWorking(true)
    try {
      await db.delete()
      showMessage('success', 'Adatbázis törölve! Frissítés...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      showMessage('error', `Hiba: ${error}`)
    } finally {
      setIsWorking(false)
    }
  }

  // Generate sample workout data
  const handleGenerateSampleData = async (days: 1 | 2 | 7) => {
    setIsWorking(true)
    try {
      const user = await getUser()
      if (!user) {
        showMessage('error', 'Nincs felhasználó! Végezd el az onboardingot először.')
        return
      }

      const templates = [chestDayTemplate, backDayTemplate]
      const now = new Date()

      for (let d = 0; d < days; d++) {
        const template = templates[d % templates.length]
        const sessionDate = new Date(now)
        sessionDate.setDate(sessionDate.getDate() - d)
        sessionDate.setHours(10, 0, 0, 0)

        // Create session
        const sessionId = await db.sessions.add({
          userId: user.id,
          templateId: template.id,
          date: sessionDate,
          startedAt: sessionDate,
          completedAt: new Date(sessionDate.getTime() + 60 * 60 * 1000), // 1 hour later
        })

        // Generate set logs for each exercise
        for (const exerciseConfig of template.exercises) {
          for (let setNum = 1; setNum <= exerciseConfig.targetSets; setNum++) {
            // Generate realistic weights based on exercise
            const baseWeight = exerciseConfig.exerciseId.includes('bench') ? 60 :
                              exerciseConfig.exerciseId.includes('deadlift') ? 100 :
                              exerciseConfig.exerciseId.includes('dumbbell') ? 20 :
                              exerciseConfig.exerciseId.includes('cable') ? 15 :
                              exerciseConfig.exerciseId.includes('machine') ? 50 : 30

            const weight = baseWeight + (Math.random() * 10 - 5)
            const reps = exerciseConfig.targetRepMin + Math.floor(Math.random() * (exerciseConfig.targetRepMax - exerciseConfig.targetRepMin + 1))
            const rir: RIR = setNum === exerciseConfig.targetSets ? 1 : (Math.random() > 0.5 ? 2 : 3)

            await db.setLogs.add({
              sessionId,
              exerciseId: exerciseConfig.exerciseId,
              setNumber: setNum,
              weightKg: Math.round(weight * 2) / 2, // Round to nearest 0.5
              reps,
              rir,
              loggedAt: new Date(sessionDate.getTime() + setNum * 3 * 60 * 1000), // 3 min apart
            })
          }
        }
      }

      showMessage('success', `${days} nap edzés adat generálva!`)
    } catch (error) {
      showMessage('error', `Hiba: ${error}`)
    } finally {
      setIsWorking(false)
    }
  }

  // Loading screen demos
  const renderLoadingDemo = () => {
    switch (loadingDemo) {
      case 'app':
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
            <div className="animate-pulse">
              <h1 className="font-display text-3xl font-bold">
                <span className="text-gradient">Goon</span>
                <span className="text-text-primary">And</span>
                <span className="text-gradient">Gain</span>
              </h1>
            </div>
            <button
              onClick={() => setLoadingDemo('none')}
              className="absolute top-4 right-4 px-4 py-2 bg-accent text-bg-primary font-display uppercase text-sm"
            >
              BEZÁR
            </button>
          </div>
        )

      case 'spinner':
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
            <div className="w-12 h-12 border-2 border-accent border-t-transparent animate-spin" />
            <button
              onClick={() => setLoadingDemo('none')}
              className="absolute top-4 right-4 px-4 py-2 bg-accent text-bg-primary font-display uppercase text-sm"
            >
              BEZÁR
            </button>
          </div>
        )

      case 'coach':
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
            <div className="bg-bg-secondary border border-text-muted/20 p-6">
              <p className="text-2xs font-display uppercase tracking-wider text-accent mb-3">
                Coach Bebi
              </p>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <button
              onClick={() => setLoadingDemo('none')}
              className="absolute top-4 right-4 px-4 py-2 bg-accent text-bg-primary font-display uppercase text-sm"
            >
              BEZÁR
            </button>
          </div>
        )

      case 'skeleton':
        return (
          <div className="fixed inset-0 z-50 bg-bg-primary overflow-auto">
            <div className="p-5">
              {/* Skeleton header */}
              <div className="h-8 w-48 bg-bg-secondary animate-pulse mb-2" />
              <div className="h-4 w-32 bg-bg-secondary animate-pulse mb-6" />

              {/* Skeleton cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-bg-secondary border border-text-muted/20">
                    <div className="h-5 w-3/4 bg-bg-elevated animate-pulse mb-3" />
                    <div className="h-4 w-1/2 bg-bg-elevated animate-pulse mb-2" />
                    <div className="h-4 w-2/3 bg-bg-elevated animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setLoadingDemo('none')}
              className="absolute top-4 right-4 px-4 py-2 bg-accent text-bg-primary font-display uppercase text-sm"
            >
              BEZÁR
            </button>
          </div>
        )

      default:
        return null
    }
  }

  // Transition screen demos
  const renderTransitionDemo = () => {
    if (transitionDemo === 'none') return null

    const data = TRANSITION_DATA[transitionDemo]
    if (!data) return null

    if (data.type === 'exercise') {
      const exerciseData = data as typeof TRANSITION_DATA['exercise-excellent']
      const moodColor = exerciseData.mood === 'excellent' ? 'bg-accent' :
                       exerciseData.mood === 'tooEasy' ? 'bg-warning' : 'bg-danger'

      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-primary z-[60] flex flex-col"
          >
            <div className="flex-1 overflow-y-auto">
              {/* Completed exercise header */}
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="px-4 pt-6 pb-4 border-b border-text-muted/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 flex items-center justify-center ${moodColor}`}>
                    {exerciseData.mood === 'excellent' ? (
                      <svg className="w-5 h-5 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : exerciseData.mood === 'tooEasy' ? (
                      <span className="text-bg-primary text-lg font-bold">?</span>
                    ) : (
                      <svg className="w-5 h-5 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-2xs font-display uppercase tracking-wider text-text-muted">Kész</p>
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
                      {exerciseData.exercise}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-bg-secondary border border-accent p-2 text-center">
                    <p className="font-mono text-xl font-bold text-accent">{exerciseData.stats.sets}</p>
                    <p className="text-2xs text-text-muted">sorozat</p>
                  </div>
                  <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                    <p className="font-mono text-xl font-bold text-text-primary">{exerciseData.stats.reps}</p>
                    <p className="text-2xs text-text-muted">rep</p>
                  </div>
                  <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                    <p className="font-mono text-xl font-bold text-text-primary">{exerciseData.stats.weight}</p>
                    <p className="text-2xs text-text-muted">kg össz</p>
                  </div>
                  <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                    <p className="font-mono text-xl font-bold text-text-primary">{exerciseData.stats.top}</p>
                    <p className="text-2xs text-text-muted">kg top</p>
                  </div>
                </div>
              </motion.div>

              {/* Coach Bebi */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center justify-center px-4 py-4"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ delay: 0.4, duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="mb-2"
                >
                  <img src={exerciseData.avatar} alt="Coach Bebi" className="w-36 h-36 object-contain" />
                </motion.div>

                <motion.h1
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-lg font-extrabold uppercase tracking-wide text-text-primary mb-1 text-center"
                >
                  {exerciseData.headline}
                </motion.h1>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-text-secondary text-sm text-center max-w-xs"
                >
                  {exerciseData.subtext}
                </motion.p>
              </motion.div>
            </div>

            {/* Next exercise */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex-shrink-0 px-4 pt-4 pb-6 border-t border-text-muted/20 bg-bg-secondary"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-12 bg-muscle-chest" />
                <div className="flex-1">
                  <p className="text-2xs font-display uppercase tracking-wider text-accent mb-0.5">Következik</p>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
                    {exerciseData.nextExercise}
                  </h3>
                  <p className="text-text-muted text-sm">4×8-12 rep</p>
                </div>
                <p className="font-mono text-xl font-bold text-text-primary">
                  2<span className="text-text-muted text-sm">/6</span>
                </p>
              </div>

              <Button size="lg" className="w-full" onClick={() => setTransitionDemo('none')}>
                TOVÁBB
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )
    }

    // Summary screen
    const summaryData = data as typeof TRANSITION_DATA['summary-beast']

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-bg-primary z-[60] flex flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            {/* Header with Bebi */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="px-4 pt-4 pb-3 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-2"
              >
                <img src={summaryData.avatar} alt="Coach Bebi" className="w-40 h-40 object-contain mx-auto" />
              </motion.div>

              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-display text-xl font-extrabold uppercase tracking-wide text-text-primary mb-1"
              >
                {summaryData.headline}
              </motion.h1>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-accent text-sm font-semibold"
              >
                {summaryData.text}
              </motion.p>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-text-muted text-xs"
              >
                {summaryData.subtext}
              </motion.p>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="px-4 pb-4"
            >
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-bg-secondary border border-accent p-2 text-center">
                  <p className="font-mono text-2xl font-bold text-accent">{summaryData.stats.sets}</p>
                  <p className="text-2xs text-text-muted">/{summaryData.stats.expected}</p>
                </div>
                <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                  <p className="font-mono text-2xl font-bold text-text-primary">{summaryData.stats.duration}</p>
                  <p className="text-2xs text-text-muted">perc</p>
                </div>
                <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                  <p className="font-mono text-2xl font-bold text-text-primary">{summaryData.stats.reps}</p>
                  <p className="text-2xs text-text-muted">rep</p>
                </div>
                <div className="bg-bg-secondary border border-text-muted/20 p-2 text-center">
                  <p className="font-mono text-2xl font-bold text-text-primary">
                    {summaryData.stats.weight >= 1000 ? `${(summaryData.stats.weight / 1000).toFixed(1)}k` : summaryData.stats.weight}
                  </p>
                  <p className="text-2xs text-text-muted">kg</p>
                </div>
              </div>
            </motion.div>

            {/* Exercise breakdown */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="px-4 pb-4"
            >
              <h3 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-2">
                Gyakorlatok
              </h3>

              <div className="space-y-1.5">
                {summaryData.exercises.map((ex, index) => (
                  <motion.div
                    key={ex.name}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="flex items-center gap-2 p-2 bg-bg-secondary border border-text-muted/10"
                  >
                    <div className="w-1 h-8" style={{ backgroundColor: ex.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold text-text-primary truncate">
                        {ex.name}
                      </p>
                      <p className="text-xs text-text-muted font-mono">{ex.top}</p>
                    </div>
                    <p className={`font-mono text-base font-bold ${ex.sets >= ex.target ? 'text-accent' : 'text-warning'}`}>
                      {ex.sets}/{ex.target}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Finish button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-text-muted/20 bg-bg-secondary"
          >
            <Button size="lg" className="w-full" onClick={() => setTransitionDemo('none')}>
              BEFEJEZÉS
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {renderLoadingDemo()}
      {renderTransitionDemo()}

      {/* Header */}
      <header className="px-5 pt-6 pb-4 border-b-2 border-text-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-accent">
              Dev Tools
            </h1>
            <p className="text-text-muted text-sm mt-1">Fejlesztoi eszkozok</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-1.5 border border-text-muted/30 text-text-muted text-2xs font-display uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
          >
            VISSZA
          </button>
        </div>
      </header>

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 p-4 border-2 ${
            message.type === 'success'
              ? 'bg-green-900/90 border-green-500 text-green-100'
              : 'bg-red-900/90 border-red-500 text-red-100'
          }`}
        >
          <p className="font-display text-sm uppercase tracking-wide">{message.text}</p>
        </div>
      )}

      {/* Data Management Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Adatkezeles
        </h2>

        <div className="space-y-3">
          {/* Reset Exercise Data */}
          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            <h3 className="font-display text-sm uppercase tracking-wide text-text-primary mb-1">
              Edzés adatok törlése
            </h3>
            <p className="text-2xs text-text-muted mb-3">
              Törli az összes session-t, set log-ot és becsült max-okat. A profil megmarad.
            </p>
            <Button
              onClick={handleResetExerciseData}
              disabled={isWorking}
              variant="secondary"
              className="text-yellow-500 border-yellow-500/50"
            >
              {isWorking ? 'FOLYAMATBAN...' : 'EDZÉS ADATOK TÖRLÉSE'}
            </Button>
          </div>

          {/* Reset All */}
          <div className="p-4 bg-bg-secondary border border-red-500/30">
            <h3 className="font-display text-sm uppercase tracking-wide text-red-400 mb-1">
              Teljes reset
            </h3>
            <p className="text-2xs text-text-muted mb-3">
              Törli az ÖSSZES adatot, beleértve a profilt. Újra kell végezni az onboardingot.
            </p>
            <Button
              onClick={handleResetAll}
              disabled={isWorking}
              variant="secondary"
              className="text-red-500 border-red-500/50"
            >
              {isWorking ? 'FOLYAMATBAN...' : 'MINDEN TÖRLÉSE'}
            </Button>
          </div>
        </div>
      </section>

      {/* Sample Data Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Minta adatok generálása
        </h2>

        <div className="p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs text-text-muted mb-4">
            Generál befejezett edzéseket (mell + hát napok) teszt adatokkal.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleGenerateSampleData(1)} disabled={isWorking} variant="secondary">
              1 NAP
            </Button>
            <Button onClick={() => handleGenerateSampleData(2)} disabled={isWorking} variant="secondary">
              2 NAP
            </Button>
            <Button onClick={() => handleGenerateSampleData(7)} disabled={isWorking} variant="secondary">
              7 NAP
            </Button>
          </div>
        </div>
      </section>

      {/* Transition Screens Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Transition Screens (Coach Bebi)
        </h2>

        <div className="space-y-3">
          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            <h3 className="font-display text-sm uppercase tracking-wide text-text-primary mb-3">
              Gyakorlat befejezés
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTransitionDemo('exercise-excellent')} variant="secondary" className="text-success border-success/50">
                EXCELLENT
              </Button>
              <Button onClick={() => setTransitionDemo('exercise-easy')} variant="secondary" className="text-warning border-warning/50">
                TOO EASY
              </Button>
              <Button onClick={() => setTransitionDemo('exercise-skip')} variant="secondary" className="text-danger border-danger/50">
                SKIPPED
              </Button>
            </div>
          </div>

          <div className="p-4 bg-bg-secondary border border-text-muted/20">
            <h3 className="font-display text-sm uppercase tracking-wide text-text-primary mb-3">
              Edzés összesítő
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTransitionDemo('summary-beast')} variant="secondary" className="text-success border-success/50">
                BEAST
              </Button>
              <Button onClick={() => setTransitionDemo('summary-meh')} variant="secondary" className="text-warning border-warning/50">
                MEH
              </Button>
              <Button onClick={() => setTransitionDemo('summary-short')} variant="secondary" className="text-danger border-danger/50">
                SHORT
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Screens Section */}
      <section className="px-5 py-4 border-b border-text-muted/10">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Loading Screens
        </h2>

        <div className="p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs text-text-muted mb-4">
            Kattints egy gombra a loading screen megtekintéséhez.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setLoadingDemo('app')} variant="secondary">
              APP LOGO
            </Button>
            <Button onClick={() => setLoadingDemo('spinner')} variant="secondary">
              SPINNER
            </Button>
            <Button onClick={() => setLoadingDemo('coach')} variant="secondary">
              COACH BEBI
            </Button>
            <Button onClick={() => setLoadingDemo('skeleton')} variant="secondary">
              SKELETON
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="px-5 py-4">
        <h2 className="text-2xs font-display uppercase tracking-wider text-text-muted mb-4">
          Gyors navigáció
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => navigate('/')} variant="ghost">
            HOME
          </Button>
          <Button onClick={() => navigate('/workout?template=chest-day')} variant="ghost">
            WORKOUT
          </Button>
          <Button onClick={() => navigate('/history')} variant="ghost">
            HISTORY
          </Button>
          <Button onClick={() => navigate('/progress')} variant="ghost">
            PROGRESS
          </Button>
          <Button onClick={() => navigate('/coach')} variant="ghost">
            COACH
          </Button>
          <Button onClick={() => navigate('/exercises')} variant="ghost">
            EXERCISES
          </Button>
        </div>
      </section>
    </div>
  )
}

export { DevPage as default }
