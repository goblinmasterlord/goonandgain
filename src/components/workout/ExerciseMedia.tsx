import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { getExerciseGifUrl, getExerciseImageUrl, isMediaConfigured } from '@/lib/utils/media'

interface ExerciseMediaProps {
  exerciseId: string
  exerciseName?: string
  className?: string
  showControls?: boolean
}

/**
 * ExerciseMedia Component
 *
 * Displays exercise demonstration GIF or static image.
 * - Tries GIF first (animated demonstration)
 * - Falls back to static image if GIF fails
 * - Shows placeholder if no media available
 */
export function ExerciseMedia({
  exerciseId,
  exerciseName,
  className,
  showControls = false,
}: ExerciseMediaProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [mediaState, setMediaState] = useState<'gif' | 'image' | 'none'>('gif')
  const [isPaused, setIsPaused] = useState(false)

  // Check if media is configured
  if (!isMediaConfigured()) {
    return (
      <div
        className={cn(
          'relative bg-bg-elevated flex items-center justify-center',
          className
        )}
      >
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 border-2 border-text-muted/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="square"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <p className="text-2xs text-text-muted uppercase tracking-wider">
            Nincs bemutató
          </p>
        </div>
      </div>
    )
  }

  const gifUrl = getExerciseGifUrl(exerciseId)
  const imageUrl = getExerciseImageUrl(exerciseId, 0)

  const handleGifError = () => {
    // GIF failed, try static image
    setMediaState('image')
    setIsLoading(true)
  }

  const handleImageError = () => {
    // Both failed, show placeholder
    setMediaState('none')
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // No media available
  if (mediaState === 'none') {
    return (
      <div
        className={cn(
          'relative bg-bg-elevated flex items-center justify-center',
          className
        )}
      >
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 border-2 border-text-muted/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="square"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <p className="text-2xs text-text-muted uppercase tracking-wider">
            Kép nem elérhető
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative bg-bg-elevated overflow-hidden', className)}>
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-elevated z-10">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
        </div>
      )}

      {/* GIF */}
      {mediaState === 'gif' && (
        <img
          src={gifUrl}
          alt={exerciseName || 'Exercise demonstration'}
          className={cn(
            'w-full h-full object-contain transition-opacity duration-200',
            isLoading ? 'opacity-0' : 'opacity-100',
            isPaused && 'brightness-75'
          )}
          onLoad={handleLoad}
          onError={handleGifError}
        />
      )}

      {/* Static image fallback */}
      {mediaState === 'image' && (
        <img
          src={imageUrl}
          alt={exerciseName || 'Exercise demonstration'}
          className={cn(
            'w-full h-full object-contain transition-opacity duration-200',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleLoad}
          onError={handleImageError}
        />
      )}

      {/* Pause/Play control for GIFs */}
      {showControls && mediaState === 'gif' && !isLoading && (
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="absolute bottom-3 right-3 p-2 bg-bg-primary/80 border border-text-muted/30 hover:border-accent/50 transition-colors"
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? (
            <svg
              className="w-4 h-4 text-text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>
      )}

      {/* Media type indicator */}
      {!isLoading && mediaState === 'image' && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-bg-primary/80 border border-text-muted/30">
          <span className="text-2xs text-text-muted uppercase tracking-wider">
            Kép
          </span>
        </div>
      )}
    </div>
  )
}
