import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateSetLog, getSetLogById } from '@/lib/db'
import { queueSync } from '@/lib/sync'
import { Button, InfoTooltip } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { SetLog, RIR } from '@/types'

interface SetEditModalProps {
  set: SetLog
  exerciseName: string
  onClose: () => void
  onSave: (updatedSet: SetLog) => void
}

export function SetEditModal({ set, exerciseName, onClose, onSave }: SetEditModalProps) {
  const [weightInput, setWeightInput] = useState(set.weightKg.toString())
  const [repsInput, setRepsInput] = useState(set.reps.toString())
  const [rirInput, setRirInput] = useState<RIR>(set.rir)
  const [isMaxAttempt, setIsMaxAttempt] = useState(set.isMaxAttempt || false)
  const [isSaving, setIsSaving] = useState(false)

  const rirOptions: RIR[] = [0, 1, 2, 3, 4]

  const handleSave = async () => {
    if (!set.id) return

    setIsSaving(true)
    try {
      const updates = {
        weightKg: parseFloat(weightInput) || set.weightKg,
        reps: parseInt(repsInput) || set.reps,
        rir: rirInput,
        isMaxAttempt,
      }

      // Update local database
      await updateSetLog(set.id, updates)

      // Queue for Supabase sync
      const updatedSet = await getSetLogById(set.id)
      if (updatedSet) {
        await queueSync('set_logs', 'update', set.id, {
          sessionId: updatedSet.sessionId,
          exerciseId: updatedSet.exerciseId,
          setNumber: updatedSet.setNumber,
          weightKg: updatedSet.weightKg,
          addedWeightKg: updatedSet.addedWeightKg,
          reps: updatedSet.reps,
          rir: updatedSet.rir,
          isMaxAttempt: updatedSet.isMaxAttempt,
          loggedAt: updatedSet.loggedAt,
        })
        onSave(updatedSet)
      }

      onClose()
    } catch (error) {
      console.error('Failed to save set:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg-primary/95 z-[60] flex flex-col"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          {/* Header */}
          <header className="px-5 pt-6 pb-4 border-b border-text-muted/20 flex items-center justify-between">
            <div>
              <p className="text-2xs font-display uppercase tracking-wider text-text-muted mb-1">
                Sorozat szerkesztése
              </p>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                {exerciseName}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-text-muted hover:text-accent">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* Form */}
          <div className="flex-1 px-5 py-6 space-y-6 overflow-auto">
            {/* Weight Input */}
            <div>
              <label className="label">Súly (kg)</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full p-4 bg-bg-secondary border-2 border-text-muted/30 font-mono text-2xl text-center text-text-primary focus:border-accent focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-display text-sm uppercase">
                  KG
                </span>
              </div>
              {/* Quick adjust buttons */}
              <div className="flex gap-2 mt-2">
                {[-5, -2.5, 2.5, 5].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => {
                      const current = parseFloat(weightInput) || 0
                      setWeightInput((current + delta).toString())
                    }}
                    className="flex-1 py-2 border border-text-muted/30 text-text-muted font-mono text-sm hover:border-accent hover:text-accent transition-colors"
                  >
                    {delta > 0 ? '+' : ''}{delta}
                  </button>
                ))}
              </div>
            </div>

            {/* Reps Input */}
            <div>
              <label className="label">Ismétlések</label>
              <input
                type="number"
                inputMode="numeric"
                value={repsInput}
                onChange={(e) => setRepsInput(e.target.value)}
                className="w-full p-4 bg-bg-secondary border-2 border-text-muted/30 font-mono text-2xl text-center text-text-primary focus:border-accent focus:outline-none transition-colors"
              />
              {/* Quick rep buttons */}
              <div className="flex gap-2 mt-2">
                {[1, 3, 5, 8, 10, 12].map((rep) => (
                  <button
                    key={rep}
                    onClick={() => setRepsInput(rep.toString())}
                    className={cn(
                      'flex-1 py-2 border font-mono text-sm transition-colors',
                      repsInput === rep.toString()
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-text-muted/30 text-text-muted hover:border-accent hover:text-accent'
                    )}
                  >
                    {rep}
                  </button>
                ))}
              </div>
            </div>

            {/* RIR Input */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="label mb-0">RIR</label>
                <InfoTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-display text-xs uppercase tracking-wider text-accent mb-1">
                        Reps In Reserve
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li><span className="font-mono text-danger font-bold">RIR 0</span> = Kimerülés</li>
                        <li><span className="font-mono text-danger">RIR 1</span> = Majdnem max</li>
                        <li><span className="font-mono text-accent">RIR 2</span> = Ideális</li>
                        <li><span className="font-mono text-warning">RIR 3</span> = Könnyű</li>
                        <li><span className="font-mono text-text-muted">RIR 4+</span> = Túl könnyű</li>
                      </ul>
                    </div>
                  }
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {rirOptions.map((rir) => (
                  <button
                    key={rir}
                    onClick={() => setRirInput(rir)}
                    className={cn(
                      'py-4 border-2 font-mono text-xl font-bold transition-all duration-100',
                      rirInput === rir
                        ? rir === 0
                          ? 'border-danger bg-danger text-white shadow-harsh'
                          : 'border-accent bg-accent text-bg-primary shadow-harsh'
                        : rir === 0
                          ? 'border-danger/50 text-danger hover:border-danger hover:bg-danger/10'
                          : 'border-text-muted/30 text-text-secondary hover:border-accent hover:text-accent'
                    )}
                  >
                    {rir === 4 ? '4+' : rir}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Attempt Toggle */}
            <div className="border border-text-muted/20 p-4 bg-bg-secondary">
              <button
                onClick={() => setIsMaxAttempt(!isMaxAttempt)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-6 h-6 border-2 flex items-center justify-center transition-all',
                    isMaxAttempt
                      ? 'border-warning bg-warning'
                      : 'border-text-muted/50'
                  )}>
                    {isMaxAttempt && (
                      <svg className="w-4 h-4 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-display text-sm font-semibold uppercase tracking-wide text-text-primary">
                      Max kísérlet
                    </p>
                    <p className="text-2xs text-text-muted mt-0.5">
                      Nehéz szimpla / 1RM teszt - nem számít a progresszióba
                    </p>
                  </div>
                </div>
                <InfoTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-display text-xs uppercase tracking-wider text-warning mb-1">
                        Max kísérlet
                      </p>
                      <p className="text-xs">
                        Ha ezt bejelölöd, ez a sorozat nem befolyásolja a következő edzés súlyjavaslatait.
                        Használd nehéz szimpláknál vagy 1RM teszteknél.
                      </p>
                    </div>
                  }
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-8 pt-4 border-t border-text-muted/20 bg-bg-secondary/50">
            <Button
              size="lg"
              className="w-full mb-3"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'MENTÉS...' : 'MENTÉS'}
            </Button>
            <button
              onClick={onClose}
              className="w-full py-3 text-text-muted font-display text-sm uppercase tracking-wider hover:text-accent transition-colors"
            >
              Mégse
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
