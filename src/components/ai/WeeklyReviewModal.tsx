import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getComprehensiveWeeklyReview, hasGeminiApiKey } from '@/lib/ai/coach'
import { Button } from '@/components/ui'
import { Link } from 'react-router-dom'

interface WeeklyReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WeeklyReviewModal({ isOpen, onClose }: WeeklyReviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [review, setReview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasApiKey = hasGeminiApiKey()

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    setReview(null)

    try {
      const response = await getComprehensiveWeeklyReview()
      if (response.success) {
        setReview(response.message)
      } else {
        setError(response.error || 'Ismeretlen hiba történt')
      }
    } catch (err) {
      setError('Hálózati hiba történt')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when modal opens
  const handleOpen = () => {
    if (!review && !isLoading && hasApiKey) {
      handleGenerate()
    }
  }

  // Trigger generation when modal opens
  if (isOpen && !review && !isLoading && !error && hasApiKey) {
    handleOpen()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/80 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-bg-secondary border-t-2 border-accent max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-text-muted/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src="/bebi-avatar.png"
                  alt="Coach Bebi"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
                    HETI ÉRTÉKELÉS
                  </h2>
                  <p className="text-xs text-text-muted">Coach Bebi elemzése</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Bezárás"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!hasApiKey ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-accent/20 text-accent">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                    API KULCS SZÜKSÉGES
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    A heti értékeléshez Gemini API kulcs szükséges.
                  </p>
                  <Link to="/settings">
                    <Button variant="primary" size="sm">
                      BEÁLLÍTÁSOK
                    </Button>
                  </Link>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <img
                      src="/bebi-avatar.png"
                      alt="Coach Bebi"
                      className="w-16 h-16 object-contain animate-pulse"
                    />
                  </div>
                  <p className="text-text-secondary text-sm animate-pulse">
                    Coach Bebi elemzi az adatokat...
                  </p>
                  <div className="flex justify-center gap-1 mt-3">
                    <span className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-500/20 text-red-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                    HIBA TÖRTÉNT
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">{error}</p>
                  <Button variant="secondary" size="sm" onClick={handleGenerate}>
                    ÚJRAPRÓBÁLÁS
                  </Button>
                </div>
              ) : review ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div
                    className="text-text-secondary leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: formatReviewText(review),
                    }}
                  />
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {review && (
              <div className="p-4 border-t border-text-muted/20 flex-shrink-0">
                <Button variant="primary" className="w-full" onClick={onClose}>
                  MEGÉRTETTEM 💪
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Format review text with proper styling
function formatReviewText(text: string): string {
  return text
    // Bold text (markdown **text**)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary font-display">$1</strong>')
    // Section headers with emojis
    .replace(/(💪|📊|🔥|⚠️|🎯|🏆|📉|🚨)\s*\*\*(.*?)\*\*/g, '<h3 class="text-accent font-display text-base font-bold mt-4 mb-2 flex items-center gap-2">$1 $2</h3>')
    // Bullet points
    .replace(/^- /gm, '• ')
    // Line breaks
    .replace(/\n/g, '<br />')
}
