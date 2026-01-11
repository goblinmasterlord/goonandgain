import type { CoachAvatar } from '@/types'

// Mood types for workout screens
export type AvatarMood = 'proud' | 'default' | 'disappointed' | 'angry'

// Avatar configuration
const AVATARS: Record<CoachAvatar, Record<AvatarMood, string>> = {
  bebi: {
    proud: '/bebi-proud.png',
    default: '/bebi-avatar.png',
    disappointed: '/bebi-disappointed.png',
    angry: '/bebi-angry.png',
  },
  marci: {
    proud: '/marci-proud.png',
    default: '/marci-avatar.png',
    disappointed: '/marci-disappointed.png',
    angry: '/marci-angry.png',
  },
}

// Coach display names (Hungarian)
export const COACH_NAMES: Record<CoachAvatar, string> = {
  bebi: 'Coach Bebi',
  marci: 'Coach Marci',
}

// Get avatar image path based on coach type and mood
export function getAvatarPath(coach: CoachAvatar = 'bebi', mood: AvatarMood = 'default'): string {
  return AVATARS[coach]?.[mood] ?? AVATARS.bebi.default
}

// Get all available coaches
export function getAvailableCoaches(): CoachAvatar[] {
  return ['bebi', 'marci']
}
