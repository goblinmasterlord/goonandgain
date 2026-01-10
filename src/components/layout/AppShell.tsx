import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { OfflineIndicator, InstallPrompt, UpdatePrompt } from '@/components/pwa'
import { WeightCheckInPrompt } from '@/components/weight'

export function AppShell() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <OfflineIndicator />
      <main className="pb-20 safe-top">
        <Outlet />
      </main>
      <BottomNav />
      <WeightCheckInPrompt />
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  )
}
