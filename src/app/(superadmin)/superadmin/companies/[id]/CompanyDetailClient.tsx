'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Company, CompanyModule, CompanyIntegration, AiConfig } from '@/types/superadmin';
import { Save, CheckCircle2, XCircle, ArrowRightCircle, UploadCloud } from 'lucide-react';
import { updateCompanyStatus } from '@/actions/superadmin/companies';
import { saveBusinessProfileAdmin } from '@/actions/superadmin/business-profile';
import { createServiceAdmin, updateServiceAdmin, toggleServiceStatusAdmin } from '@/actions/superadmin/services';
import { getProductsAdmin, createProductAdmin, updateProductAdmin, toggleProductStatusAdmin } from '@/actions/superadmin/products';
import BusinessProfileForm from '@/components/domain/BusinessProfileForm';
import ServicesManager from '@/components/domain/ServicesManager';
import ProductsManager from '@/components/domain/ProductsManager';
import InventoryCsvImporter from '@/components/domain/InventoryCsvImporter';
import PaymentSettingsForm from '@/components/domain/PaymentSettingsForm';
import { upsertPaymentSettingsAdmin } from '@/actions/superadmin/payment-settings';
import type { BusinessProfileInput, ServiceInput, CompanyServiceRow } from '@/types/business';
import type { PaymentSettingsInput, PaymentSettings } from '@/types/payments';

interface CompanyDetailClientProps {
  company: Company;
  modules: CompanyModule[];
  integrations: CompanyIntegration[];
  aiConfig: AiConfig;
  adminAccessStatus?: 'pending' | 'active' | 'missing' | 'ambiguous';
  initialBusinessProfile: Partial<BusinessProfileInput>;
  initialServices: CompanyServiceRow[];
  initialPaymentSettings: PaymentSettings | null;
}

export default function CompanyDetailClient({ company, modules, integrations, aiConfig, adminAccessStatus, initialBusinessProfile, initialServices, initialPaymentSettings }: CompanyDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Admin access resend state
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; success?: boolean; error?: string }>({ loading: false });

  const handleToggleStatus = async () => {
    setIsSaving(true);
    await updateCompanyStatus(company.id, !company.is_active);
    setIsSaving(false);
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
      <div className="flex border-b border-white/10 overflow-x-auto">
        {[
          { id: 'general', label: 'General' },
          { id: 'modules', label: 'Módulos' },
          { id: 'ai', label: 'Inteligencia Artificial' },
          { id: 'integrations', label: 'Integraciones' },
          { id: 'inventory', label: 'Inventario' },
          { id: 'business', label: 'Negocio' },
          { id: 'services', label: 'Servicios' },
          { id: 'payments', label: 'Pagos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-white/5'}`}
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
          <ProductsManager
            fetchProducts={(params) => getProductsAdmin(String(company.id), params)}
            createProduct={(input) => createProductAdmin(String(company.id), input)}
            updateProduct={(id, input) => updateProductAdmin(String(company.id), id, input)}
            toggleProductStatus={(id, isActive) => toggleProductStatusAdmin(String(company.id), id, isActive)}
            csvImporterNode={
              <InventoryCsvImporter
                uploadUrl="/api/superadmin/import-csv"
                extraFormData={{
                  company_id: String(company.id),
                  mode: 'update_inventory'
                }}
                onSuccess={() => {
                  // Podríamos recargar solo el componente si le pasamos un ref, 
                  // pero por simplicidad recargamos.
                  window.location.reload();
                }}
              />
            }
          />
        )}

        {activeTab === 'business' && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Perfil del Negocio</h3>
            <BusinessProfileForm
              initialData={initialBusinessProfile}
              onSubmit={async (data: BusinessProfileInput) => {
                const result = await saveBusinessProfileAdmin(String(company.id), data);
                if (result.success) router.refresh();
                return result;
              }}
            />
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Servicios y Precios</h3>
            <ServicesManager
              services={initialServices}
              onCreate={(input: ServiceInput) => {
                const result = createServiceAdmin(String(company.id), input);
                result.then((r) => { if (r.success) router.refresh(); });
                return result;
              }}
              onUpdate={(serviceId: string, input: ServiceInput) => {
                const result = updateServiceAdmin(String(company.id), serviceId, input);
                result.then((r) => { if (r.success) router.refresh(); });
                return result;
              }}
              onToggle={(serviceId: string, isActive: boolean) => {
                const result = toggleServiceStatusAdmin(String(company.id), serviceId, isActive);
                result.then((r) => { if (r.success) router.refresh(); });
                return result;
              }}
            />
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Configuración de Cobro</h3>
            <PaymentSettingsForm
              initialData={initialPaymentSettings ?? null}
              onSubmit={async (data: PaymentSettingsInput) => {
                const result = await upsertPaymentSettingsAdmin(Number(company.id), data);
                if (result.success) router.refresh();
                return result;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
