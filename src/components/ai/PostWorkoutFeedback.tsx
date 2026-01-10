import { useState, useEffect } from 'react'
import { getPostWorkoutFeedback, hasGeminiApiKey } from '@/lib/ai'

interface PostWorkoutFeedbackProps {
  sessionId: number
  onClose: () => void
}

export function PostWorkoutFeedback({ sessionId, onClose }: PostWorkoutFeedbackProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFeedback()
  }, [sessionId])

  const loadFeedback = async () => {
    if (!hasGeminiApiKey()) {
      setError('Nincs Gemini API kulcs beállítva')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await getPostWorkoutFeedback(sessionId)
      if (response.success) {
        setFeedback(response.message)
      } else {
        setError(response.error || 'Hiba történt')
      }
    } catch {
      setError('Nem sikerült betölteni a visszajelzést')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-bg-primary/95 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-bg-secondary border-2 border-accent">
        {/* Header */}
        <div className="px-5 py-4 border-b border-text-muted/20 flex items-center gap-3">
          <div className="w-10 h-10 border border-accent flex items-center justify-center">
            <span className="text-xl">💪</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-text-primary uppercase tracking-wide">
              Coach Bebi
            </h2>
            <p className="text-2xs text-text-muted">Edzés összefoglaló</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <div className="flex gap-1 mb-4">
                <div className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-text-muted text-sm">Coach Bebi elemzi az edzésedet...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-danger text-sm mb-4">{error}</p>
              <button
                onClick={onClose}
                className="text-accent text-sm hover:underline"
              >
                Bezárás
              </button>
            </div>
          ) : (
            <div>
              <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                {feedback}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && (
          <div className="px-5 py-4 border-t border-text-muted/20">
            <button
              onClick={onClose}
              className="w-full py-3 bg-accent text-bg-primary font-display uppercase tracking-wider hover:bg-accent/90 transition-colors"
            >
              KÖSZI, BEBI!
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
