import { useWorkoutStore } from '@/stores'
import { Button } from '@/components/ui'

export function RestTimer() {
  const { isResting, restTimeRemaining, stopRestTimer } = useWorkoutStore()

  if (!isResting) return null

  const minutes = Math.floor(restTimeRemaining / 60)
  const seconds = restTimeRemaining % 60

  const formatTime = (min: number, sec: number) => {
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progressPercent = 100 // Would need original time to calculate

  return (
    <div className="fixed inset-0 bg-bg-primary/95 z-50 flex flex-col items-center justify-center">
      {/* Background pulse animation */}
      <div className="absolute inset-0 bg-accent/5 animate-pulse-slow" />

      <div className="relative text-center px-6">
        {/* Rest label */}
        <p className="text-2xs font-display uppercase tracking-[0.4em] text-accent mb-4">
          PIHENJ
        </p>

        {/* Time display */}
        <div className="font-mono text-8xl font-bold text-text-primary mb-2">
          {formatTime(minutes, seconds)}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-bg-elevated mx-auto mb-8">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Tip */}
        <p className="text-text-muted text-sm mb-8 max-w-xs mx-auto">
          Használd ki a pihenőidőt, hogy megfigyelje a formád és készülj a következő sorozatra
        </p>

        {/* Skip button */}
        <Button variant="ghost" onClick={stopRestTimer} className="border border-text-muted/30">
          PIHENŐ KIHAGYÁSA
        </Button>
      </div>
    </div>
  )
}
