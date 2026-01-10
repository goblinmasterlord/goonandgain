import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { OfflineIndicator, InstallPrompt, UpdatePrompt } from '@/components/pwa'
import { WeightCheckInPrompt } from '@/components/weight'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-bg-primary">
      <OfflineIndicator />
      <main className="pb-24 safe-top">
        <Outlet />
      </main>
      <BottomNav />
      <WeightCheckInPrompt />
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  )
}
