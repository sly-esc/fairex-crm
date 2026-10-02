import { getServices } from '@/actions/dashboard/services'
import ServiciosClient from './ServiciosClient'

export const dynamic = 'force-dynamic'

export default async function ServiciosPage() {
  const servicesResult = await getServices()

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Catálogo de Servicios</h1>
        <p className="text-zinc-400">Gestiona los productos y servicios que la IA puede ofrecer o cotizar a tus clientes.</p>
      </div>
      <ServiciosClient initialServices={servicesResult.data ?? []} />
    </div>
  )
}
