import { Outlet } from 'react-router-dom'

export function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Outlet />
    </div>
  )
}

export { WelcomePage } from './Welcome'
export { PersonalDataPage } from './PersonalData'
export { ProfileSetupPage } from './ProfileSetup'
export { ProgramSelectPage } from './ProgramSelect'
export { TrainingSetupPage } from './TrainingSetup'
export { ReadyPage } from './Ready'
