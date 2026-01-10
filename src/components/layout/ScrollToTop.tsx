import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop - Resets scroll position to top on route change
 *
 * This component solves the common PWA/SPA issue where navigating
 * between pages preserves the scroll position from the previous page.
 *
 * Place this component inside your Router but outside your Routes.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0)

    // Also reset any scroll containers that might exist
    // This handles cases where content is in a scrollable div
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }, [pathname])

  return null
}
