import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'accent' | 'harsh'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-bg-secondary border border-text-muted/20 hover:border-text-muted/40',
      elevated: 'bg-bg-elevated border-2 border-text-muted/30',
      accent: 'bg-bg-secondary border-l-4 border-l-accent border border-text-muted/20',
      harsh: 'bg-bg-elevated border-2 border-text-muted/30 shadow-harsh hover:shadow-harsh-lg',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'p-5 transition-all duration-200 relative overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-display font-bold text-xl uppercase tracking-wide', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'
