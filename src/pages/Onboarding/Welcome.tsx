import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Diagonal accent line */}
      <div className="absolute top-0 right-0 w-1 h-[200vh] bg-accent origin-top-right rotate-[30deg] translate-x-20 -translate-y-20 opacity-20" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo/Brand */}
        <div className="mb-12 animate-slide-up">
          <p className="text-2xs font-display uppercase tracking-[0.4em] text-text-muted mb-4">
            SZEMÉLYES EDZÉSTERVEZŐ
          </p>
          <h1 className="font-display text-6xl font-extrabold tracking-tight leading-none">
            <span className="text-text-primary block">GOON</span>
            <span className="text-accent text-7xl">&</span>
            <span className="text-text-primary block">GAIN</span>
          </h1>
        </div>

        {/* Tagline */}
        <div className="mb-12 animate-slide-up stagger-2">
          <div className="w-16 h-0.5 bg-accent mb-6" />
          <p className="text-text-secondary text-lg leading-relaxed max-w-xs">
            Tudományosan megalapozott edzéstervezés. Automatikus progresszív túlterhelés. AI edző támogatás.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-12 animate-slide-up stagger-3">
          {[
            'Személyre szabott edzéstervek',
            'Valós idejű sorozat követés',
            'Heti volumen dashboard',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-accent" />
              <span className="text-sm text-text-muted font-display uppercase tracking-wider">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative px-6 pb-12 animate-slide-up stagger-4">
        <Button
          size="lg"
          className="w-full shadow-harsh glow-accent"
          onClick={() => navigate('/onboarding/personal')}
        >
          KEZDJÜK EL
        </Button>
        <p className="text-center text-2xs text-text-muted mt-4 font-display uppercase tracking-wider">
          2 perc beállítás
        </p>

        {/* Recovery link */}
        <button
          type="button"
          onClick={() => navigate('/recovery')}
          className="w-full mt-6 text-center text-sm text-text-muted hover:text-accent transition-colors"
        >
          Van már profilom
        </button>
      </div>

      {/* Version badge */}
      <div className="absolute bottom-4 left-6">
        <span className="text-2xs font-mono text-text-muted">v1.3.0</span>
      </div>
    </div>
  )
}
