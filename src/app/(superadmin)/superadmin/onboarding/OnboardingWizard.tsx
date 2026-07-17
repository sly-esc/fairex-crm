'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, UploadCloud, Building2, UserPlus, Layers, Bot, Puzzle } from 'lucide-react';
import { createCompany } from '@/actions/superadmin/companies';
import { inviteAdminUser } from '@/actions/superadmin/users';
import { toggleModule } from '@/actions/superadmin/modules';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [companyId, setCompanyId] = useState<string | null>(null);
  
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
    facebook_page_id: '',
    facebook_token: '',
    rack_api_key: '',
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<any>(null);

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
      // Guardar cada módulo
      for (const [key, active] of Object.entries(modules)) {
        await toggleModule(companyId, key, active);
      }
      setCurrentStep(4);
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
      await saveAiConfig(companyId, aiConfig);
      setCurrentStep(5);
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
      if (integrations.whatsapp_id && integrations.whatsapp_token) {
        await saveIntegration(companyId, 'meta', 'whatsapp_official', integrations.whatsapp_id, { token: integrations.whatsapp_token }, {}, 'WhatsApp Business');
      }
      if (integrations.facebook_page_id && integrations.facebook_token) {
        await saveIntegration(companyId, 'meta', 'facebook_page', integrations.facebook_page_id, { token: integrations.facebook_token }, {}, 'Facebook Page');
      }
      if (integrations.rack_api_key) {
        await saveIntegration(companyId, 'rack', 'rack_erp', 'rack-main', { api_key: integrations.rack_api_key }, {}, 'Rack ERP');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stepper Header */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => (
              <li key={step.title} className={`relative ${stepIdx !== STEPS.length - 1 ? 'w-full pr-8 sm:pr-20' : ''}`}>
                <div className="flex items-center">
                  <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${currentStep > step.id ? 'border-emerald-500 bg-emerald-500' : currentStep === step.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-900'}`}>
                    <step.icon className={`h-5 w-5 ${currentStep > step.id ? 'text-white' : currentStep === step.id ? 'text-indigo-400' : 'text-zinc-500'}`} aria-hidden="true" />
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div className={`absolute top-1/2 left-10 w-full h-0.5 -translate-y-1/2 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
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

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isProcessing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
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
                <h3 className="text-md font-medium text-emerald-400 mb-4 flex items-center gap-2">Meta: WhatsApp Business</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Phone Number ID</label>
                    <input type="text" value={integrations.whatsapp_id} onChange={e => setIntegrations({...integrations, whatsapp_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Permanent Token</label>
                    <input type="password" value={integrations.whatsapp_token} onChange={e => setIntegrations({...integrations, whatsapp_token: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-black/20 border border-white/10 rounded-xl">
                <h3 className="text-md font-medium text-blue-400 mb-4 flex items-center gap-2">Meta: Facebook Page</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Page ID</label>
                    <input type="text" value={integrations.facebook_page_id} onChange={e => setIntegrations({...integrations, facebook_page_id: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Page Access Token</label>
                    <input type="password" value={integrations.facebook_token} onChange={e => setIntegrations({...integrations, facebook_token: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-black/20 border border-white/10 rounded-xl">
                <h3 className="text-md font-medium text-indigo-400 mb-4 flex items-center gap-2">Rack ERP</h3>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">API Key</label>
                  <input type="password" value={integrations.rack_api_key} onChange={e => setIntegrations({...integrations, rack_api_key: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={handleStep5Submit} disabled={isProcessing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
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

                <div className="pt-6">
                  <button 
                    onClick={handleStep6Submit} 
                    disabled={isProcessing || !csvFile} 
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
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
