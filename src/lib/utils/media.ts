/**
 * Exercise Media URL Helper
 *
 * Uses Cloudflare R2 for hosting exercise GIFs/images.
 * Falls back gracefully if media not found.
 *
 * R2 Bucket: goonandgain-exercises
 * Public URL: https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev
 */

const MEDIA_BASE_URL = import.meta.env.VITE_EXERCISE_MEDIA_BASE_URL || ''

/**
 * Get the GIF URL for an exercise
 * GIFs are preferred as they show the full movement animation
 */
export function getExerciseGifUrl(exerciseId: string): string {
  if (!MEDIA_BASE_URL) return ''
  return `${MEDIA_BASE_URL}/${exerciseId}.gif`
}

/**
 * Get a static image URL for an exercise
 * Images are used as fallback when GIF is not available
 * @param index - Image index (0, 1, etc. for different angles)
 */
export function getExerciseImageUrl(exerciseId: string, index = 0): string {
  if (!MEDIA_BASE_URL) return ''
  return `${MEDIA_BASE_URL}/${exerciseId}-${index}.jpg`
}

/**
 * Get the primary media URL for an exercise
 * Prefers GIF, component should fallback to image on error
 */
export function getExerciseMediaUrl(exerciseId: string): string {
  return getExerciseGifUrl(exerciseId)
}

/**
 * Check if exercise media is configured
 */
export function isMediaConfigured(): boolean {
  return Boolean(MEDIA_BASE_URL)
}

/**
 * Get the base URL for media (for debugging)
 */
export function getMediaBaseUrl(): string {
  return MEDIA_BASE_URL
}
