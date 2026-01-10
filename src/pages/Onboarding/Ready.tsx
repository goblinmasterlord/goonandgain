import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { db } from '@/lib/db'

export function ReadyPage() {
  const navigate = useNavigate()

  const handleComplete = async () => {
    try {
      const data = JSON.parse(localStorage.getItem('onboarding_data') || '{}')

      // Create user in database
      const userId = crypto.randomUUID()
      await db.users.add({
        id: userId,
        createdAt: new Date(),
        currentWeightKg: data.weight || 80,
        gender: data.gender || 'male',
        birthYear: data.age ? new Date().getFullYear() - data.age : undefined,
        trainingDays: data.trainingDays || {},
        weightUpdatedAt: new Date(),
      })

      // Add initial weight history
      await db.weightHistory.add({
        userId,
        weightKg: data.weight || 80,
        recordedAt: new Date(),
      })

      // Clear temporary storage
      localStorage.removeItem('onboarding_data')
      localStorage.setItem('onboarding_complete', 'true')

      // Navigate to home
      navigate('/')
    } catch (error) {
      console.error('Failed to save user data:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-8 animate-fade-in">
        <div className="text-6xl">💪</div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold">Kész!</h1>
          <p className="text-text-secondary max-w-sm">
            Az első edzéseden rögzítjük a súlyokat, és onnan építkezünk. Minden egyes edzéssel egyre pontosabb lesz a rendszer.
          </p>
        </div>

        <div className="pt-8 space-y-3 w-full max-w-xs mx-auto">
          <Button size="lg" className="w-full glow-accent" onClick={handleComplete}>
            Irány az edzés!
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding/training')}
          >
            Vissza
          </Button>
        </div>
      </div>
    </div>
  )
}
