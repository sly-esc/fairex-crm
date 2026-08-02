'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Company, CompanyModule, CompanyIntegration, AiConfig } from '@/types/superadmin';
import { Save, CheckCircle2, XCircle, ArrowRightCircle, UploadCloud } from 'lucide-react';
import { updateCompanyStatus } from '@/actions/superadmin/companies';

interface CompanyDetailClientProps {
  company: Company;
  modules: CompanyModule[];
  integrations: CompanyIntegration[];
  aiConfig: AiConfig;
  adminAccessStatus?: 'pending' | 'active' | 'missing' | 'ambiguous';
}

export default function CompanyDetailClient({ company, modules, integrations, aiConfig, adminAccessStatus }: CompanyDetailClientProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Inventory CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvRowErrors, setCsvRowErrors] = useState<{ row: number; error: string }[]>([]);
  const [csvSuccess, setCsvSuccess] = useState<{ importedCount: number } | null>(null);

  // Admin access resend state
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; success?: boolean; error?: string }>({ loading: false });

  const handleToggleStatus = async () => {
    setIsSaving(true);
    await updateCompanyStatus(company.id, !company.is_active);
    setIsSaving(false);
  };

  const handleInventoryUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvError(null);
    setCsvRowErrors([]);
    setCsvSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('company_id', String(company.id));
      formData.append('mode', 'update_inventory');

      const res = await fetch('/api/superadmin/import-csv', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.data?.valid) {
        setCsvSuccess({ importedCount: json.data.importedCount ?? json.data.validRows ?? 0 });
        setCsvFile(null);
      } else if (json.data?.errors?.length > 0) {
        setCsvRowErrors(json.data.errors);
        setCsvError('El CSV tiene errores de validación. Corrígelos y vuelve a intentar.');
      } else {
        setCsvError(json.error || 'Error al procesar el archivo CSV.');
      }
    } catch (err: any) {
      setCsvError(err.message || 'Error de red al subir el archivo.');
    }
    setCsvLoading(false);
  };

  const handleResendAccess = async () => {
    setResendStatus({ loading: true });
    try {
      const numericCompanyId = Number(company.id);
      if (!Number.isSafeInteger(numericCompanyId) || numericCompanyId <= 0) {
        setResendStatus({ loading: false, error: 'No fue posible identificar la empresa.' });
        return;
      }
      const { resendAdminAccess } = await import('@/actions/superadmin/users');
      const result = await resendAdminAccess(numericCompanyId);
      if (result.success) {
        setResendStatus({ loading: false, success: true });
      } else {
        const errorMsg = result.code === 'already_active' 
          ? 'El acceso ya está activo.' 
          : 'Error al reenviar el acceso. Inténtalo de nuevo.';
        setResendStatus({ loading: false, error: errorMsg });
      }
    } catch (err) {
      setResendStatus({ loading: false, error: 'Error inesperado.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 border border-white/10 p-6 rounded-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${company.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {company.is_active ? 'Activa' : 'Suspendida'}
            </span>
          </div>
          <p className="text-zinc-400 mt-1 text-sm flex gap-4">
            <span>Slug: <span className="text-zinc-300 font-mono">{company.slug || '-'}</span></span>
            <span>Plan: <span className="text-zinc-300 capitalize">{company.plan}</span></span>
            <span>Onboarding: <span className={company.onboarding_completed_at ? 'text-emerald-400' : 'text-amber-400'}>{company.onboarding_completed_at ? 'Completado' : `Estado: ${company.onboarding_status}`}</span></span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link 
            href={`/superadmin/onboarding?companyId=${company.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            {company.onboarding_status === 'completed' ? 'Editar Configuración' : 'Continuar Onboarding'} <ArrowRightCircle className="w-4 h-4" />
          </Link>
          <button 
            onClick={handleToggleStatus}
            disabled={isSaving}
            className="px-4 py-2 bg-black/40 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-lg text-sm transition-colors"
          >
            {company.is_active ? 'Suspender Empresa' : 'Reactivar Empresa'}
          </button>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'general', label: 'General' },
          { id: 'modules', label: 'Módulos' },
          { id: 'ai', label: 'Inteligencia Artificial' },
          { id: 'integrations', label: 'Integraciones' },
          { id: 'inventory', label: 'Inventario' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-white/5'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6 min-h-[400px]">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white mb-4">Información General</h3>
            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">ID Interno</label>
                <div className="text-sm font-mono text-zinc-300 bg-black/40 p-2 rounded border border-white/5">{company.id}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Industria</label>
                <div className="text-sm text-zinc-300">{company.industry || '-'}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Fecha de Creación</label>
                <div className="text-sm text-zinc-300">{new Date(company.created_at).toLocaleString()}</div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-white/10 pt-6">
              <h4 className="text-sm font-medium text-white mb-4">Acceso de Administrador</h4>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleResendAccess}
                  disabled={resendStatus.loading || adminAccessStatus !== 'pending'}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                >
                  {resendStatus.loading ? 'Enviando...' : 'Reenviar acceso al administrador'}
                </button>
                {adminAccessStatus !== 'pending' && (
                  <span className="text-xs text-zinc-500">
                    {adminAccessStatus === 'active' ? 'El administrador ya está activo.' : 'Estado del administrador no permite reenvío.'}
                  </span>
                )}
              </div>
              
              {resendStatus.success && (
                <div className="mt-3 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  El acceso ha sido reenviado correctamente.
                </div>
              )}
              {resendStatus.error && (
                <div className="mt-3 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {resendStatus.error}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Módulos Activos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map(mod => (
                <div key={mod.module_key} className="p-4 rounded-lg border border-white/10 bg-black/20 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200 capitalize">{mod.module_key.replace('_', ' ')}</p>
                    <p className="text-xs text-zinc-500">Plan req: {mod.plan_required}</p>
                  </div>
                  {mod.is_active ? <CheckCircle2 className="text-emerald-400 w-5 h-5" /> : <XCircle className="text-zinc-600 w-5 h-5" />}
                </div>
              ))}
              {modules.length === 0 && <p className="text-zinc-500">No hay módulos configurados.</p>}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-3xl space-y-6">
            <h3 className="text-lg font-medium text-white mb-4">Configuración Base de IA</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Identidad (ai_identity)</label>
                <textarea className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500" readOnly value={aiConfig?.ai_identity || ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Reglas de Negocio (ai_business_rules)</label>
                <textarea className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500" readOnly value={aiConfig?.ai_business_rules || ''} />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">* Para editar esta configuración usa el flujo de Onboarding o la API directa.</p>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Integraciones Conectadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map(int => (
                <div key={int.id} className="p-4 rounded-lg border border-white/10 bg-black/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs font-medium uppercase tracking-wider">{int.provider}</span>
                    <span className={`w-2 h-2 rounded-full ${int.status === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  </div>
                  <p className="font-medium text-zinc-200">{int.display_name || int.provider}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-1">{int.provider_account_id || 'Sin ID'}</p>
                  <p className="text-xs text-zinc-600 mt-3 flex justify-between">
                    <span>{int.connection_type}</span>
                    <span>Sync: {int.sync_frequency}</span>
                  </p>
                </div>
              ))}
              {integrations.length === 0 && <p className="text-zinc-500">No hay integraciones conectadas.</p>}
            </div>
          </div>
        )}
        {activeTab === 'inventory' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Actualizar Inventario CSV</h3>
              <p className="text-sm text-zinc-400 mb-3">Sube un CSV para actualizar precios, stock y catálogo. Máx 5 MB / 2,000 filas. No afecta el estado del onboarding.</p>
              <div className="bg-zinc-800/60 border border-white/10 rounded-lg p-4 text-xs text-zinc-400 space-y-1">
                <p className="text-zinc-300 font-medium mb-2">📌 Columnas requeridas</p>
                <p><span className="text-indigo-300 font-mono">Identificador único</span> — puede llamarse: <span className="font-mono">sku</span>, <span className="font-mono">código</span>, <span className="font-mono">VIN</span>, <span className="font-mono">lote</span>, <span className="font-mono">stock_number</span>, <span className="font-mono">clave</span>, <span className="font-mono">id_producto</span></p>
                <p><span className="text-indigo-300 font-mono">Nombre</span> — puede llamarse: <span className="font-mono">nombre</span>, <span className="font-mono">name</span>, <span className="font-mono">título</span>, <span className="font-mono">modelo</span>, <span className="font-mono">producto</span></p>
                <p className="text-zinc-500 pt-1">Columnas opcionales: precio, costo, stock, stock_minimo, unidad, categoria, imagen_url</p>
                <p className="text-zinc-500">Separadores soportados: coma (<span className="font-mono">,</span>) o punto y coma (<span className="font-mono">;</span>)</p>
              </div>
            </div>

            {csvSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-emerald-400 font-medium">{csvSuccess.importedCount} producto(s) importados correctamente.</p>
                <button
                  onClick={() => { setCsvSuccess(null); setCsvError(null); setCsvRowErrors([]); }}
                  className="text-sm text-zinc-400 hover:text-white underline transition-colors"
                >
                  Subir otro archivo
                </button>
              </div>
            ) : (
              <>
                {/* Drop zone */}
                <div className="relative border-2 border-dashed border-white/20 rounded-xl p-10 bg-black/20 hover:bg-black/30 transition-colors flex flex-col items-center justify-center group">
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setCsvFile(f);
                      setCsvError(null);
                      setCsvRowErrors([]);
                      setCsvSuccess(null);
                    }}
                  />
                  <UploadCloud className="w-10 h-10 text-zinc-500 mb-3 group-hover:text-indigo-400 transition-colors" />
                  {csvFile ? (
                    <>
                      <p className="text-white font-medium text-sm">{csvFile.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <p className="text-zinc-400 text-sm">Haz clic o arrastra un archivo CSV aquí</p>
                  )}
                </div>

                {/* Validation errors */}
                {csvError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
                    <p className="font-medium mb-2">{csvError}</p>
                    {csvRowErrors.length > 0 && (
                      <ul className="max-h-48 overflow-y-auto list-disc pl-5 space-y-1 text-xs">
                        {csvRowErrors.map((e, i) => (
                          <li key={i}>Fila {e.row}: {e.error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleInventoryUpload}
                  disabled={csvLoading || !csvFile}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {csvLoading ? 'Validando y actualizando...' : 'Validar y actualizar inventario'}
                  {!csvLoading && <UploadCloud className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
