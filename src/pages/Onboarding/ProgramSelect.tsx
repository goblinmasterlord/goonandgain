import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { SplitType } from '@/types'

interface SplitOption {
  id: SplitType
  nameHu: string
  descriptionHu: string
  features: string[]
  frequency: string
  icon: React.ReactNode
}

const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'bro-split',
    nameHu: 'Bro Split',
    descriptionHu: 'Klasszikus izomcsoport-alapú edzésterv',
    features: [
      'Naponta 1 izomcsoport',
      'Heti 1× minden izomcsoport',
      'Magas volumen/edzés',
    ],
    frequency: '5-6 nap/hét',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'ppl',
    nameHu: 'Push/Pull/Legs',
    descriptionHu: 'Mozgásminta alapú felosztás',
    features: [
      'Push: Mell, Váll, Tricepsz',
      'Pull: Hát, Bicepsz',
      'Legs: Teljes láb',
      'Heti 2× minden izomcsoport',
    ],
    frequency: '6 nap/hét',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M5 12h14M12 5v14" strokeLinecap="square" />
        <path d="M19 12l-4-4m4 4l-4 4" strokeLinecap="square" />
        <path d="M5 12l4-4m-4 4l4 4" strokeLinecap="square" />
      </svg>
    ),
  },
]

export function ProgramSelectPage() {
  const navigate = useNavigate()
  const [selectedSplit, setSelectedSplit] = useState<SplitType | null>(null)

  const handleNext = () => {
    if (selectedSplit) {
      const existingData = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
      localStorage.setItem('onboarding_data', JSON.stringify({
        ...existingData,
        splitType: selectedSplit,
      }))
      navigate('/onboarding/training')
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Progress bar */}
      <div className="h-1 bg-bg-elevated">
        <div className="h-full w-1/2 bg-accent" />
      </div>

      <div className="px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-sm text-accent">02</span>
            <div className="flex-1 h-px bg-text-muted/20" />
            <span className="font-mono text-sm text-text-muted">04</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide mb-2">
            Edzésprogram
          </h1>
          <p className="text-text-secondary text-sm">
            Válaszd ki a neked megfelelő edzésfelosztást
          </p>
        </header>

        {/* Split options */}
        <div className="space-y-4">
          {SPLIT_OPTIONS.map((split) => (
            <button
              key={split.id}
              type="button"
              onClick={() => setSelectedSplit(split.id)}
              className={cn(
                'w-full p-5 border-2 transition-all duration-100 text-left',
                selectedSplit === split.id
                  ? 'border-accent bg-accent/10 shadow-harsh'
                  : 'border-text-muted/30 hover:border-text-muted/50'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 p-3',
                    selectedSplit === split.id
                      ? 'bg-accent text-bg-primary'
                      : 'bg-bg-elevated text-text-muted'
                  )}
                >
                  {split.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={cn(
                        'font-display text-lg font-bold uppercase tracking-wide',
                        selectedSplit === split.id ? 'text-accent' : 'text-text-primary'
                      )}
                    >
                      {split.nameHu}
                    </h3>
                    <span className="font-mono text-xs text-text-muted">
                      {split.frequency}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm mb-3">
                    {split.descriptionHu}
                  </p>
                  <ul className="space-y-1">
                    {split.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-text-muted"
                      >
                        <div className="w-1 h-1 bg-text-muted" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info card */}
        <div className="mt-6 p-4 bg-bg-secondary border border-text-muted/20">
          <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">
            MELYIKET VÁLASSZAM?
          </p>
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">PPL</strong> jobb a hipertrófiához a magasabb frekvencia miatt.{' '}
            <strong className="text-text-primary">Bro Split</strong> ideális, ha szereted egy izomcsoportra fókuszálni az edzést.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedSplit}
            onClick={handleNext}
          >
            TOVÁBB
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/onboarding/personal')}
          >
            VISSZA
          </Button>
        </div>
      </div>
    </div>
  )
}
