'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronRight, UploadCloud, Building2, UserPlus, Layers, Bot, Puzzle } from 'lucide-react';
import { createCompany, getCompanyDetail, updateCompanyStatus, updateOnboardingStatus, skipCSVAndFinishOnboarding } from '@/actions/superadmin/companies';
import { inviteAdminUser } from '@/actions/superadmin/users';
import { saveAllCompanyModules } from '@/actions/superadmin/modules';
import { saveAiConfig } from '@/actions/superadmin/ai-config';
import { saveIntegration } from '@/actions/superadmin/integrations';
import { PlanType, Company } from '@/types/superadmin';

const STEPS = [
  { id: 1, title: 'Empresa', icon: Building2 },
  { id: 2, title: 'Administrador', icon: UserPlus },
  { id: 3, title: 'Módulos', icon: Layers },
  { id: 4, title: 'Configurar IA', icon: Bot },
  { id: 5, title: 'Integraciones', icon: Puzzle },
  { id: 6, title: 'Inventario CSV', icon: UploadCloud },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('companyId');

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!initialCompanyId);
  
  // Form States
  const [companyData, setCompanyData] = useState({ name: '', slug: '', industry: '', plan: 'starter' as PlanType });
  const [adminData, setAdminData] = useState({ email: '', name: '' });
  
  const [modules, setModules] = useState<Record<string, boolean>>({
    crm: true,
    inventario: true,
    whatsapp_bot: true,
    pipeline: true,
    cotizaciones: false,
    reportes: false,
  });

  const [aiConfig, setAiConfig] = useState({
    ai_identity: 'Eres el asistente virtual oficial de la empresa...',
    ai_business_rules: '- Trata al cliente con respeto.\n- No ofrezcas descuentos no autorizados.',
    ai_commercial_style: 'Profesional pero cercano.',
    ai_constraints: '- No hablar de competencia.\n- Derivar a humano si piden algo complejo.',
  });

  const [integrations, setIntegrations] = useState({
    whatsapp_id: '',
    whatsapp_token: '',
    whatsapp_has_credentials: false,
    facebook_page_id: '',
    facebook_token: '',
    facebook_has_credentials: false,
    rack_api_key: '',
    rack_has_credentials: false,
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    if (!initialCompanyId) return;

    const loadCompany = async () => {
      setIsLoading(true);
      try {
        const res = await getCompanyDetail(initialCompanyId);
        if (!mounted) return;

        if (!res.success || !res.data) {
          setError(res.error || 'No se pudo cargar la empresa para continuar el onboarding.');
          return;
        }

        const data = res.data;
        setCompanyId(initialCompanyId);
        setCompanyData({
          name: data.name,
          slug: data.slug,
          industry: data.industry || '',
          plan: data.plan || 'starter'
        });

        // Precarga Módulos
        if (data.company_modules && data.company_modules.length > 0) {
          const loadedModules: Record<string, boolean> = {};
          data.company_modules.forEach((m: any) => {
            loadedModules[m.module_key] = m.is_active;
          });
          setModules(prev => ({ ...prev, ...loadedModules }));
        }

        // Precarga IA
        if (data.company_settings && data.company_settings.length > 0) {
          const settings = data.company_settings[0];
          setAiConfig({
            ai_identity: settings.ai_identity || '',
            ai_business_rules: settings.ai_business_rules || '',
            ai_commercial_style: settings.ai_commercial_style || '',
            ai_constraints: settings.ai_constraints || '',
          });
        }

        // Precarga Integraciones — solo IDs públicos y booleano de has_credentials, nunca secretos
        if (data.company_integrations && data.company_integrations.length > 0) {
          setIntegrations(prev => {
            const updated = { ...prev };
            data.company_integrations.forEach((int: any) => {
              if (int.integration_key === 'whatsapp_official') {
                updated.whatsapp_id = int.provider_account_id || '';
                updated.whatsapp_has_credentials = int.has_credentials || false;
              }
              if (int.integration_key === 'facebook_page') {
                updated.facebook_page_id = int.provider_account_id || '';
                updated.facebook_has_credentials = int.has_credentials || false;
              }
              if (int.integration_key === 'rack_erp') {
                updated.rack_has_credentials = int.has_credentials || false;
              }
            });
            return updated;
          });
        }

        // Inferencia del paso inicial
        if (data.onboarding_status === 'completed') {
          router.push(`/superadmin/companies/${initialCompanyId}`);
          return;
        }

        let nextStep = 2;
        const hasConnectedIntegration = data.company_integrations?.some(
          (int: any) => int.is_active && int.status === 'connected' && int.has_credentials
        );

        if (data.company_settings && data.company_settings.length > 0) {
          if (hasConnectedIntegration) {
            nextStep = 6; // Integración conectada → ir a Inventario CSV
          } else {
            nextStep = 5; // Sin integraciones conectadas → ir a Integraciones
          }
        } else if (data.company_modules && data.company_modules.length > 0) {
          nextStep = 4; // Módulos guardados → ir a IA
        }
        setCurrentStep(nextStep);

      } catch (err: any) {
        if (!mounted) return;
        setError(`Error cargando el onboarding: ${err?.message ?? 'Error desconocido'}`);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadCompany();

    return () => {
      mounted = false;
    };
  }, [initialCompanyId, router]);

  if (isLoading) {
    return <div className="text-zinc-400 text-center py-12">Cargando progreso del onboarding...</div>;
  }

  // Handlers for Steps
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    try {
      const res = await createCompany({
        companyName: companyData.name,
        slug: companyData.slug,
        industry: companyData.industry,
        plan: companyData.plan,
        adminEmail: '', // Admin is step 2
      });
      if (res.success && res.data) {
        setCompanyId(res.data.id);
        setCurrentStep(2);
      } else {
        setError(res.error || 'Error desconocido al crear empresa');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await inviteAdminUser(companyId, adminData.email);
      if (res.success) {
        setCurrentStep(3);
      } else {
        setError(res.error || 'Error desconocido al invitar usuario');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  const handleStep3Submit = async () => {
    if (!companyId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await saveAllCompanyModules(companyId, modules);
      if (res.success) {
        setCurrentStep(4);
      } else {
        setError(res.error || 'Error al guardar módulos');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  const handleStep4Submit = async () => {
    if (!companyId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await saveAiConfig(companyId, aiConfig);
      if (res.success) {
        setCurrentStep(5);
      } else {
        setError(res.error || 'Error al guardar configuración de IA');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  const handleStep5Submit = async () => {
    if (!companyId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const hasWhatsapp = integrations.whatsapp_id || integrations.whatsapp_token || integrations.whatsapp_has_credentials;
      const hasFacebook = integrations.facebook_page_id || integrations.facebook_token || integrations.facebook_has_credentials;
      const hasRack = integrations.rack_api_key || integrations.rack_has_credentials;

      if (!hasWhatsapp && !hasFacebook && !hasRack) {
        setError('No has llenado ninguna integración. Configura al menos una o usa "Configurar después".');
        setIsProcessing(false);
        return;
      }

      if (integrations.whatsapp_id || integrations.whatsapp_token) {
        const res = await saveIntegration(Number(companyId), 'whatsapp_official', integrations.whatsapp_id, integrations.whatsapp_token);
        if (!res.success) throw new Error(`WhatsApp: ${res.error}`);
      }
      
      if (integrations.facebook_page_id || integrations.facebook_token) {
        const res = await saveIntegration(Number(companyId), 'facebook_page', integrations.facebook_page_id, integrations.facebook_token);
        if (!res.success) throw new Error(`Facebook: ${res.error}`);
      }
      
      if (integrations.rack_api_key) {
        const res = await saveIntegration(Number(companyId), 'rack_erp', 'rack-main', integrations.rack_api_key);
        if (!res.success) throw new Error(`Rack: ${res.error}`);
      }
      
      setCurrentStep(6);
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  const handleStep6Submit = async () => {
    if (!companyId || !csvFile) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('company_id', companyId);

      const res = await fetch('/api/superadmin/import-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success && data.data.valid) {
        setCsvResult(data.data);
        // Onboarding finalizado!
        setTimeout(() => {
          router.push(`/superadmin/companies/${companyId}`);
        }, 3000);
      } else {
        setError(data.error || 'Error de validación CSV');
        setCsvResult(data.data); // Muestra errores por fila
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  const handleSkipCSV = async () => {
    if (!companyId) return;
    if (!confirm('¿Estás seguro de omitir la carga de inventario? Podrás configurar los productos después.')) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const res = await skipCSVAndFinishOnboarding(Number(companyId));
      if (res.success) {
        router.push(`/superadmin/companies/${companyId}`);
      } else {
        setError(res.error || 'Error al finalizar el onboarding');
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper Header */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => (
              <li key={step.title} className={stepIdx !== STEPS.length - 1 ? 'w-full pr-8 sm:pr-20' : ''}>
                <div className="relative flex items-center">
                  <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${currentStep > step.id ? 'border-emerald-500 bg-emerald-500' : currentStep === step.id ? 'border-indigo-500 bg-[#111119]' : 'border-zinc-700 bg-zinc-900'}`}>
                    <step.icon className={`h-5 w-5 ${currentStep > step.id ? 'text-white' : currentStep === step.id ? 'text-indigo-400' : 'text-zinc-500'}`} aria-hidden="true" />
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div className={`absolute top-1/2 left-10 w-[calc(100%-2.5rem)] h-0.5 -translate-y-1/2 z-0 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                  )}
                </div>
                <div className="mt-3 hidden sm:block">
                  <span className={`text-xs font-medium ${currentStep >= step.id ? 'text-white' : 'text-zinc-500'}`}>{step.title}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-8 backdrop-blur-sm min-h-[400px]">
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Datos de la Empresa</h2>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre Comercial</label>
              <input required type="text" value={companyData.name} onChange={e => setCompanyData({...companyData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Ej. Comercializadora Norte" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Slug (URL identificador único)</label>
              <input required type="text" value={companyData.slug} onChange={e => setCompanyData({...companyData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm" placeholder="comercial-norte" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Industria</label>
              <input type="text" value={companyData.industry} onChange={e => setCompanyData({...companyData, industry: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Retail, Servicios, etc." />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Plan</label>
              <select value={companyData.plan} onChange={e => setCompanyData({...companyData, plan: e.target.value as PlanType})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 appearance-none">
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isProcessing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                {isProcessing ? 'Guardando...' : 'Crear y Continuar'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Invitar Administrador</h2>
            <p className="text-zinc-400 text-sm mb-6">El administrador recibirá un correo de Supabase para configurar su contraseña y acceder al Dashboard.</p>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre (Opcional)</label>
              <input type="text" value={adminData.name} onChange={e => setAdminData({...adminData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Juan Pérez" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Correo Electrónico</label>
              <input required type="email" value={adminData.email} onChange={e => setAdminData({...adminData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="admin@empresa.com" />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              {/* Botón secundario: solo visible si el Wizard retomó una empresa existente */}
              {initialCompanyId && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-6 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-medium rounded-lg transition-colors text-sm"
                >
                  Ya invité administrador, continuar →
                </button>
              )}
              <button type="submit" disabled={isProcessing} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {isProcessing ? 'Enviando invitación...' : 'Invitar y Continuar'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Activar Módulos (Feature Flags)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(modules).map((key) => (
                <label key={key} className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${modules[key] ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}>
                  <div>
                    <p className={`font-medium capitalize ${modules[key] ? 'text-indigo-300' : 'text-zinc-300'}`}>{key.replace('_', ' ')}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${modules[key] ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${modules[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  {/* Invisible checkbox para accesibilidad/estado */}
                  <input type="checkbox" className="sr-only" checked={modules[key]} onChange={(e) => setModules({...modules, [key]: e.target.checked})} />
                </label>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <button onClick={handleStep3Submit} disabled={isProcessing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                {isProcessing ? 'Guardando...' : 'Guardar y Continuar'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Configuración IA (Runtime Object)</h2>
            <p className="text-zinc-400 text-sm mb-6">Define cómo el Bot se comportará para esta empresa específica.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Identidad (ai_identity)</label>
                <textarea rows={4} value={aiConfig.ai_identity} onChange={e => setAiConfig({...aiConfig, ai_identity: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Eres..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Reglas de Negocio (ai_business_rules)</label>
                <textarea rows={4} value={aiConfig.ai_business_rules} onChange={e => setAiConfig({...aiConfig, ai_business_rules: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="1. ..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Estilo Comercial (ai_commercial_style)</label>
                <textarea rows={3} value={aiConfig.ai_commercial_style} onChange={e => setAiConfig({...aiConfig, ai_commercial_style: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Corto, directo..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Restricciones (ai_constraints)</label>
                <textarea rows={3} value={aiConfig.ai_constraints} onChange={e => setAiConfig({...aiConfig, ai_constraints: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="No hables de..." />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={handleStep4Submit} disabled={isProcessing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                {isProcessing ? 'Guardando...' : 'Guardar y Continuar'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Integraciones de Terceros</h2>
            <p className="text-zinc-400 text-sm mb-6">Conecta las cuentas clave. Los tokens quedarán encriptados y nunca llegarán al frontend del cliente.</p>
            
            <div className="space-y-6">
              <div className="p-5 bg-black/20 border border-white/10 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-emerald-400 flex items-center gap-2">Meta: WhatsApp Business</h3>
                  {integrations.whatsapp_has_credentials && <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Configurada</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Phone Number ID</label>
                    <input type="text" autoComplete="off" spellCheck={false} autoCapitalize="none" autoCorrect="off" value={integrations.whatsapp_id} onChange={e => setIntegrations({...integrations, whatsapp_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Permanent Token</label>
                    <input type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" autoCorrect="off" value={integrations.whatsapp_token} onChange={e => setIntegrations({...integrations, whatsapp_token: e.target.value})} placeholder={integrations.whatsapp_has_credentials ? "•••••• (Guardado)" : ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-black/20 border border-white/10 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-blue-400 flex items-center gap-2">Meta: Facebook Page</h3>
                  {integrations.facebook_has_credentials && <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Configurada</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Page ID</label>
                    <input type="text" autoComplete="off" spellCheck={false} autoCapitalize="none" autoCorrect="off" value={integrations.facebook_page_id} onChange={e => setIntegrations({...integrations, facebook_page_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Page Access Token</label>
                    <input type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" autoCorrect="off" value={integrations.facebook_token} onChange={e => setIntegrations({...integrations, facebook_token: e.target.value})} placeholder={integrations.facebook_has_credentials ? "•••••• (Guardado)" : ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-black/20 border border-white/10 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-indigo-400 flex items-center gap-2">Rack ERP</h3>
                  {integrations.rack_has_credentials && <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Configurada</span>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">API Key</label>
                  <input type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" autoCorrect="off" value={integrations.rack_api_key} onChange={e => setIntegrations({...integrations, rack_api_key: e.target.value})} placeholder={integrations.rack_has_credentials ? "•••••• (Guardado)" : ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button onClick={() => setCurrentStep(6)} disabled={isProcessing} className="w-full sm:w-auto px-6 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-medium rounded-lg transition-colors text-sm">
                Configurar después →
              </button>
              <button onClick={handleStep5Submit} disabled={isProcessing} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {isProcessing ? 'Guardando...' : 'Guardar y Continuar'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Importar Inventario CSV</h2>
            <p className="text-zinc-400 text-sm mb-6">Sube el archivo CSV base para tener la empresa operativa inmediatamente. Requiere columnas `sku` y `nombre`.</p>
            
            {!csvResult ? (
              <>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 bg-black/20 hover:bg-black/30 transition-colors flex flex-col items-center justify-center relative group">
                  <input 
                    type="file" 
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCsvFile(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud className="w-12 h-12 text-zinc-500 mb-4 group-hover:text-indigo-400 transition-colors" />
                  <p className="text-white font-medium">{csvFile ? csvFile.name : 'Haz clic o arrastra un archivo CSV aquí'}</p>
                  {csvFile && <p className="text-xs text-zinc-400 mt-2">{(csvFile.size / 1024).toFixed(2)} KB</p>}
                </div>

                <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button 
                    onClick={handleSkipCSV} 
                    disabled={isProcessing} 
                    className="px-6 py-3 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium rounded-lg transition-colors border border-white/10"
                  >
                    Omitir y Finalizar Onboarding
                  </button>
                  <button 
                    onClick={handleStep6Submit} 
                    disabled={isProcessing || !csvFile} 
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? 'Validando y Finalizando...' : 'Validar y Finalizar Onboarding'} <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center space-y-4">
                {csvResult.valid ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">¡Onboarding Completado!</h3>
                    <p className="text-emerald-400">CSV Validado: {csvResult.importedCount ?? csvResult.validRows} productos importados a tu inventario.</p>
                    <p className="text-zinc-400 text-sm">Redirigiendo al perfil de la empresa...</p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Errores de Validación</h3>
                    <div className="max-h-40 overflow-y-auto text-left bg-black/50 p-4 rounded-lg mt-4 border border-red-500/20">
                      <ul className="list-disc pl-5 space-y-1">
                        {csvResult.errors.map((err: any, i: number) => (
                          <li key={i} className="text-sm text-red-400">Fila {err.row}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                    <button 
                      onClick={() => setCsvResult(null)}
                      className="mt-6 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Intentar con otro archivo
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
