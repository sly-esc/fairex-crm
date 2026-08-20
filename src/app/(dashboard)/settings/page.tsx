import { getBusinessProfile } from '@/actions/dashboard/business-profile'
import { getServices } from '@/actions/dashboard/services'
import { getPaymentSettings } from '@/actions/dashboard/payment-settings'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [profileResult, servicesResult, paymentResult] = await Promise.all([
    getBusinessProfile(),
    getServices(),
    getPaymentSettings(),
  ])

  return (
    <SettingsClient
      initialBusinessProfile={profileResult.data ?? {}}
      initialServices={servicesResult.data ?? []}
      initialPaymentSettings={paymentResult.data ?? null}
    />
  )
}
