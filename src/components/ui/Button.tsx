import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = cn(
      'relative inline-flex items-center justify-center',
      'font-display font-semibold uppercase tracking-wider',
      'border-2 transition-all duration-100',
      'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      'disabled:opacity-50 disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0'
    )

    const variants = {
      primary: 'bg-accent text-bg-primary border-accent hover:bg-accent-hover hover:shadow-harsh',
      secondary: 'bg-transparent text-text-primary border-text-muted hover:border-accent hover:text-accent hover:shadow-harsh',
      ghost: 'bg-transparent text-text-secondary border-transparent hover:text-accent hover:border-accent/30',
      danger: 'bg-danger text-bg-primary border-danger hover:shadow-[4px_4px_0_0_rgba(255,0,60,0.3)]',
    }

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-5 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
