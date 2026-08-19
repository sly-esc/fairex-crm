import { getBusinessProfile } from '@/actions/dashboard/business-profile'
import { getServices } from '@/actions/dashboard/services'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const [profileResult, servicesResult] = await Promise.all([
    getBusinessProfile(),
    getServices(),
  ])

  return (
    <SettingsClient
      initialBusinessProfile={profileResult.data ?? {}}
      initialServices={servicesResult.data ?? []}
    />
  )
}
