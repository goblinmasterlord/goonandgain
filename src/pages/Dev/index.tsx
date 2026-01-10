import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, getUser } from '@/lib/db'
import { Button } from '@/components/ui'
import { chestDayTemplate, backDayTemplate } from '@/data/templates'
import type { RIR } from '@/types'

type LoadingDemo = 'none' | 'app' | 'spinner' | 'coach' | 'skeleton'

export function DevPage() {
  const navigate = useNavigate()
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loadingDemo, setLoadingDemo] = useState<LoadingDemo>('none')

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

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {renderLoadingDemo()}

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
