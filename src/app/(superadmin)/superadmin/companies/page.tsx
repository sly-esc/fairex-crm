import { listAllCompanies } from "@/actions/superadmin/companies";
import Link from "next/link";
import { PlusCircle, Search, Filter, Building2 } from "lucide-react";

export default async function CompaniesListPage() {
  const { success, data: companies, error } = await listAllCompanies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Empresas</h1>
          <p className="text-zinc-400 mt-2">Gestión de todos los clientes (tenants) de la plataforma.</p>
        </div>
        
        <Link 
          href="/superadmin/onboarding" 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Crear Empresa
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o slug..." 
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg text-sm text-zinc-300 hover:bg-white/5 transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-black/40">
              <tr>
                <th className="px-6 py-4 font-medium">Empresa</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Industria</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {success && companies && companies.length > 0 ? (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{company.name}</span>
                        <span className="text-xs text-zinc-500">{company.slug || 'Sin slug'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/10 rounded-md text-xs font-medium text-zinc-300 capitalize">
                        {company.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {company.industry || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${company.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${company.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {company.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/superadmin/companies/${company.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                      >
                        Administrar
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-12 h-12 text-zinc-600 mb-4" />
                      <p className="text-zinc-400">{error ? `Error: ${error}` : 'No hay empresas registradas.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
