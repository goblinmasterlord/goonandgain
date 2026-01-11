import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { HomePage } from '@/pages/Home'
import { ExercisesPage, ExerciseDetailPage } from '@/pages/Exercises'
import { ProgressPage } from '@/pages/Progress'
import { HistoryPage } from '@/pages/History'
import { SettingsPage } from '@/pages/Settings'
import { WorkoutPage } from '@/pages/Workout'
import { CoachPage } from '@/pages/Coach'
import { DevPage } from '@/pages/Dev'
import {
  OnboardingLayout,
  WelcomePage,
  PersonalDataPage,
  ProgramSelectPage,
  TrainingSetupPage,
  ReadyPage,
} from '@/pages/Onboarding'
import { hasUser } from '@/lib/db'
import { initSupabase, initSyncState, processSyncQueue } from '@/lib/sync'

// Context to share auth state with route guards
const AuthContext = createContext<{
  needsOnboarding: boolean
  isLoading: boolean
  recheckUser: () => void
}>({
  needsOnboarding: true,
  isLoading: true,
  recheckUser: () => {},
})

export const useAuth = () => useContext(AuthContext)

// Route guard for protected routes
function RequireUser() {
  const { needsOnboarding, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-pulse">
          <h1 className="font-display text-3xl font-bold">
            <span className="text-gradient">Goon</span>
            <span className="text-text-primary">And</span>
            <span className="text-gradient">Gain</span>
          </h1>
        </div>
      </div>
    )
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return <AppShell />
}

// Route guard for onboarding (redirect to home if already onboarded)
function RequireOnboarding() {
  const { needsOnboarding, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-pulse">
          <h1 className="font-display text-3xl font-bold">
            <span className="text-gradient">Goon</span>
            <span className="text-text-primary">And</span>
            <span className="text-gradient">Gain</span>
          </h1>
        </div>
      </div>
    )
  }

  if (!needsOnboarding) {
    return <Navigate to="/" replace />
  }

  return <OnboardingLayout />
}

// Create router once, outside of component
const router = createBrowserRouter([
  {
    path: '/',
    element: <RequireUser />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'workout', element: <WorkoutPage /> },
      { path: 'exercises', element: <ExercisesPage /> },
      { path: 'exercises/:id', element: <ExerciseDetailPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'coach', element: <CoachPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'dev', element: <DevPage /> },
    ],
  },
  {
    path: '/onboarding',
    element: <RequireOnboarding />,
    children: [
      { index: true, element: <WelcomePage /> },
      { path: 'personal', element: <PersonalDataPage /> },
      { path: 'program', element: <ProgramSelectPage /> },
      { path: 'training', element: <TrainingSetupPage /> },
      { path: 'ready', element: <ReadyPage /> },
    ],
  },
])

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(true)

  const checkUser = useCallback(async () => {
    try {
      const userExists = await hasUser()
      setNeedsOnboarding(!userExists)
    } catch (error) {
      console.error('Failed to check user:', error)
      setNeedsOnboarding(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkUser()

    // Initialize Supabase sync
    initSupabase()
    initSyncState()

    // Process sync queue on startup if online
    if (navigator.onLine) {
      processSyncQueue()
    }

    // Listen for online/offline events
    const handleOnline = () => {
      processSyncQueue()
    }

    window.addEventListener('online', handleOnline)

    // Listen for onboarding completion (custom event from Ready.tsx)
    const handleOnboardingComplete = () => {
      checkUser()
    }

    window.addEventListener('onboarding-complete', handleOnboardingComplete)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('onboarding-complete', handleOnboardingComplete)
    }
  }, [checkUser])

  return (
    <AuthContext.Provider value={{ needsOnboarding, isLoading, recheckUser: checkUser }}>
      <RouterProvider router={router} />
    </AuthContext.Provider>
  )
}

export default App
