import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export function PersonalDataPage() {
  const navigate = useNavigate()
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | null>(null)
  const [age, setAge] = useState('')

  const isValid = weight && gender

  const handleNext = () => {
    if (isValid) {
      localStorage.setItem('onboarding_data', JSON.stringify({
        weight: parseFloat(weight),
        gender,
        age: age ? parseInt(age) : undefined,
      }))
      navigate('/onboarding/profile')
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Progress bar */}
      <div className="h-1 bg-bg-elevated">
        <div className="h-full w-[20%] bg-accent" />
      </div>

      <div className="px-6 py-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm text-accent">01</span>
            <div className="flex-1 h-px bg-text-muted/20" />
            <span className="font-mono text-sm text-text-muted">05</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
            Személyes adatok
          </h1>
          <p className="text-text-secondary text-sm">
            Ezek segítenek személyre szabni az edzésterved
          </p>
        </header>

        {/* Form */}
        <div className="space-y-8">
          {/* Weight */}
          <div>
            <Input
              label="Testsúly"
              type="number"
              placeholder="80"
              suffix="KG"
              variant="mono"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="label">Nem</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={cn(
                  'p-6 border-2 transition-all duration-100 text-center',
                  gender === 'male'
                    ? 'border-accent bg-accent/10 shadow-harsh'
                    : 'border-text-muted/30 hover:border-text-muted/50'
                )}
              >
                <div className="font-mono text-4xl mb-2">M</div>
                <span className={cn(
                  'font-display text-sm uppercase tracking-wider',
                  gender === 'male' ? 'text-accent' : 'text-text-secondary'
                )}>
                  Férfi
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={cn(
                  'p-6 border-2 transition-all duration-100 text-center',
                  gender === 'female'
                    ? 'border-accent bg-accent/10 shadow-harsh'
                    : 'border-text-muted/30 hover:border-text-muted/50'
                )}
              >
                <div className="font-mono text-4xl mb-2">F</div>
                <span className={cn(
                  'font-display text-sm uppercase tracking-wider',
                  gender === 'female' ? 'text-accent' : 'text-text-secondary'
                )}>
                  Nő
                </span>
              </button>
            </div>
          </div>

          {/* Age */}
          <div>
            <Input
              label="Életkor (opcionális)"
              type="number"
              placeholder="25"
              suffix="ÉV"
              variant="mono"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <p className="text-2xs text-text-muted mt-2 uppercase tracking-wider">
              Regenerációs ajánlásokhoz
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-12 space-y-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!isValid}
            onClick={handleNext}
          >
            TOVÁBB
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding')}
          >
            VISSZA
          </Button>
        </div>
      </div>
    </div>
  )
}
