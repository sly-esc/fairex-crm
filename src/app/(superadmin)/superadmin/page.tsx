import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/superadmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, Users } from "lucide-react";

export default async function SuperAdminDashboard() {
  const auth = await requireSuperAdmin();
  if (!auth.success) redirect('/login');

  const supabase = createAdminClient();
  
  // Obtener estadísticas usando columnas reales de la DB
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
    
  const { count: activeCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'activa');  // columna real es 'estado', no 'is_active'
    
  const { count: onboardedCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .not('onboarding_completed_at', 'is', null);

  // Obtener empresas recientes con columnas explícitas para mapeo correcto
  const { data: recentCompaniesRaw } = await supabase
    .from('companies')
    .select('id, nombre, plan, estado, onboarding_status, onboarding_completed_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Mapear columnas DB → propiedades UI
  const recentCompanies = (recentCompaniesRaw || []).map((c: any) => ({
    ...c,
    name: c.nombre ?? '(Sin nombre)',
    is_active: c.estado === 'activa',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard General</h1>
        <p className="text-zinc-400 mt-2">Métricas y resumen operativo de toda la plataforma.</p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Empresas</p>
              <h2 className="text-3xl font-bold text-white">{totalCompanies || 0}</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Empresas Activas</p>
              <h2 className="text-3xl font-bold text-white">{activeCompanies || 0}</h2>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Onboardings Completados</p>
              <h2 className="text-3xl font-bold text-white">{onboardedCompanies || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Empresas recientes */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Empresas Recientes</h2>
          <Link href="/superadmin/companies" className="text-sm text-indigo-400 hover:text-indigo-300">
            Ver todas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-black/20">
              <tr>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Onboarding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentCompanies?.map((company) => (
                <tr key={company.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    <Link href={`/superadmin/companies/${company.id}`} className="hover:underline">
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/10 rounded-md text-xs font-medium text-zinc-300 capitalize">
                      {company.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${company.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {company.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {company.onboarding_completed_at ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completado</span>
                    ) : (
                      <span>Estado: {company.onboarding_status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!recentCompanies || recentCompanies.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No hay empresas registradas
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
