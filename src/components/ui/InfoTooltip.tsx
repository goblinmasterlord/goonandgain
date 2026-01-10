import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface InfoTooltipProps {
  content: React.ReactNode
  className?: string
}

/**
 * InfoTooltip - A tap-to-show tooltip with an info icon
 *
 * Designed for mobile-first UX where hover isn't available.
 * User taps the (?) icon to show/hide the tooltip.
 */
export function InfoTooltip({ content, className }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-5 h-5 flex items-center justify-center border text-xs font-mono transition-colors',
          isOpen
            ? 'border-accent text-accent bg-accent/10'
            : 'border-text-muted/50 text-text-muted hover:border-accent hover:text-accent'
        )}
        aria-label="Információ megjelenítése"
      >
        ?
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close on tap outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Tooltip content */}
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-64 p-3 bg-bg-secondary border border-accent/50 shadow-harsh"
            >
              {/* Arrow pointer */}
              <div className="absolute -top-1.5 right-1.5 w-3 h-3 bg-bg-secondary border-l border-t border-accent/50 rotate-45" />

              <div className="relative text-sm text-text-secondary">
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
