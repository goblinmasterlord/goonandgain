import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  suffix?: string
  variant?: 'default' | 'mono'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, suffix, variant = 'default', type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 bg-bg-elevated border-2 border-text-muted/30',
              'text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-accent focus:shadow-glow-sm',
              'transition-all duration-150',
              variant === 'mono' && 'font-mono text-lg tracking-wide',
              suffix && 'pr-14',
              error && 'border-danger focus:border-danger',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-display text-sm uppercase tracking-wider">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs text-danger uppercase tracking-wider">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
