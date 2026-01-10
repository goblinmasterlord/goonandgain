import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'

const navItems = [
  {
    path: '/',
    label: 'EDZÉS',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    path: '/exercises',
    label: 'KÖNYVTÁR',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    path: '/progress',
    label: 'STATISZTIKA',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 21h18M3 21V8l4-5v18M9 21V10l4-3v14M15 21V12l4-4v13" />
      </svg>
    ),
  },
  {
    path: '/history',
    label: 'NAPLÓ',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" strokeLinecap="square" />
      </svg>
    ),
  },
  {
    path: '/coach',
    label: 'BEBI',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t-2 border-text-muted/20 safe-bottom z-50">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 transition-all duration-100 relative',
                'border-r border-text-muted/10 last:border-r-0',
                isActive
                  ? 'text-accent bg-accent/5'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
                )}
                <div className={cn(isActive && 'animate-pulse-accent')}>
                  {item.icon}
                </div>
                <span className="text-2xs mt-1.5 font-display tracking-[0.15em]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
