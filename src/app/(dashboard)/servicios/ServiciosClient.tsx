'use client'

import { useRouter } from 'next/navigation'
import ServicesManager from '@/components/domain/ServicesManager'
import { createService, updateService, toggleServiceStatus } from '@/actions/dashboard/services'
import type { ServiceInput, CompanyServiceRow } from '@/types/business'

export default function ServiciosClient({ initialServices }: { initialServices: CompanyServiceRow[] }) {
  const router = useRouter()

  const handleCreateService = async (input: ServiceInput) => {
    const result = await createService(input)
    if (result.success) router.refresh()
    return result
  }

  const handleUpdateService = async (serviceId: string, input: ServiceInput) => {
    const result = await updateService(serviceId, input)
    if (result.success) router.refresh()
    return result
  }

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    const result = await toggleServiceStatus(serviceId, isActive)
    if (result.success) router.refresh()
    return result
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
      <ServicesManager
        services={initialServices}
        onCreate={handleCreateService}
        onUpdate={handleUpdateService}
        onToggle={handleToggleService}
      />
    </div>
  )
}
