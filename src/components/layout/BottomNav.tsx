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
    path: '/settings',
    label: 'BEÁLLÍTÁS',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path
          strokeLinecap="square"
          strokeLinejoin="miter"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="square" strokeLinejoin="miter" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav
      className="bg-bg-primary border-t-2 border-text-muted/20 z-50"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
      }}
    >
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
