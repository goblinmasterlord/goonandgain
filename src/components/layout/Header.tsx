import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  /** Main title - will be sized responsively based on length */
  title?: string
  /** Smaller subtitle text above or below title */
  subtitle?: string
  /** Show back button that navigates to previous page */
  showBack?: boolean
  /** Custom back path instead of navigate(-1) */
  backPath?: string
  /** Text for back button (default: "Vissza") */
  backText?: string
  /** Right-side action elements */
  actions?: React.ReactNode
  /** Left-side content (replaces title section) */
  leftContent?: React.ReactNode
  /** Additional className for the header container */
  className?: string
  /** Border at bottom (default: true) */
  showBorder?: boolean
  /** Color stripe on the left */
  accentColor?: string
  /** Make header transparent (for overlay pages) */
  transparent?: boolean
}

export function Header({
  title,
  subtitle,
  showBack = false,
  backPath,
  backText = 'Vissza',
  actions,
  leftContent,
  className,
  showBorder = true,
  accentColor,
  transparent = false,
}: HeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  // Calculate title size based on length for responsive sizing
  const getTitleClasses = (text: string) => {
    const len = text.length
    if (len <= 12) return 'text-xl'
    if (len <= 20) return 'text-lg'
    if (len <= 30) return 'text-base'
    return 'text-sm'
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        transparent
          ? 'bg-transparent'
          : 'bg-bg-primary/90 backdrop-blur-md',
        showBorder && 'border-b-2 border-text-muted/20',
        className
      )}
    >
      <div className="px-4 py-3">
        {/* Back button row */}
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-2 -ml-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-display uppercase tracking-wider">{backText}</span>
          </button>
        )}

        {/* Main content row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left side */}
          {leftContent ? (
            leftContent
          ) : title ? (
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Accent color stripe */}
              {accentColor && (
                <div
                  className="w-1.5 h-10 flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: accentColor }}
                />
              )}
              <div className="min-w-0 flex-1">
                {subtitle && (
                  <p className="text-2xs font-display uppercase tracking-[0.2em] text-text-muted mb-0.5 truncate">
                    {subtitle}
                  </p>
                )}
                <h1
                  className={cn(
                    'font-display font-extrabold uppercase tracking-wide text-text-primary truncate',
                    getTitleClasses(title)
                  )}
                  title={title}
                >
                  {title}
                </h1>
              </div>
            </div>
          ) : null}

          {/* Right side actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * Compact header variant for pages with less vertical space
 */
export function HeaderCompact({
  title,
  showBack = false,
  backPath,
  actions,
  className,
}: Omit<HeaderProps, 'subtitle' | 'leftContent' | 'showBorder' | 'accentColor' | 'transparent'>) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b border-text-muted/20',
        className
      )}
    >
      <div className="h-12 px-4 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-1 -ml-1 text-text-muted hover:text-accent transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="square" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {title && (
            <h1 className="font-display text-sm font-bold uppercase tracking-wider text-text-primary truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right side actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
