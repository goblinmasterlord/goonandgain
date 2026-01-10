import { useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { HomePage } from '@/pages/Home'
import { ExercisesPage, ExerciseDetailPage } from '@/pages/Exercises'
import { ProgressPage } from '@/pages/Progress'
import { HistoryPage } from '@/pages/History'
import { SettingsPage } from '@/pages/Settings'
import { WorkoutPage } from '@/pages/Workout'
import { CoachPage } from '@/pages/Coach'
import {
  OnboardingLayout,
  WelcomePage,
  PersonalDataPage,
  TrainingSetupPage,
  ReadyPage,
} from '@/pages/Onboarding'
import { hasUser } from '@/lib/db'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userExists = await hasUser()
        setNeedsOnboarding(!userExists)
      } catch (error) {
        console.error('Failed to check user:', error)
        setNeedsOnboarding(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [])

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

  const router = createBrowserRouter([
    {
      path: '/',
      element: needsOnboarding ? <Navigate to="/onboarding" replace /> : <AppShell />,
      children: needsOnboarding
        ? []
        : [
            { index: true, element: <HomePage /> },
            { path: 'workout', element: <WorkoutPage /> },
            { path: 'exercises', element: <ExercisesPage /> },
            { path: 'exercises/:id', element: <ExerciseDetailPage /> },
            { path: 'progress', element: <ProgressPage /> },
            { path: 'history', element: <HistoryPage /> },
            { path: 'coach', element: <CoachPage /> },
            { path: 'settings', element: <SettingsPage /> },
          ],
    },
    {
      path: '/onboarding',
      element: <OnboardingLayout />,
      children: [
        { index: true, element: <WelcomePage /> },
        { path: 'personal', element: <PersonalDataPage /> },
        { path: 'training', element: <TrainingSetupPage /> },
        { path: 'ready', element: <ReadyPage /> },
      ],
    },
  ])

  return <RouterProvider router={router} />
}

export default App
