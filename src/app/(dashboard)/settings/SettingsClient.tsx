'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Palette, Brain, Link as LinkIcon, Save, Database, Workflow, MessageCircle, Lock, Headset, Briefcase, Layers, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import BusinessProfileForm from '@/components/domain/BusinessProfileForm'
import ServicesManager from '@/components/domain/ServicesManager'
import PaymentSettingsForm from '@/components/domain/PaymentSettingsForm'
import { updateBusinessProfile } from '@/actions/dashboard/business-profile'
import { createService, updateService, toggleServiceStatus } from '@/actions/dashboard/services'
import { upsertPaymentSettings } from '@/actions/dashboard/payment-settings'
import type { BusinessProfileInput, CompanyServiceRow } from '@/types/business'
import type { ServiceInput } from '@/types/business'
import type { PaymentSettingsInput, PaymentSettingsRow } from '@/types/payments'

interface SettingsClientProps {
  initialBusinessProfile: Partial<BusinessProfileInput>
  initialServices: CompanyServiceRow[]
  initialPaymentSettings: PaymentSettingsRow | null
}

export default function SettingsClient({ initialBusinessProfile, initialServices, initialPaymentSettings }: SettingsClientProps) {
  const router = useRouter()
  const { addToast, branding, updateBranding, company, updateCompany } = useAppStore()
  const [isSaving, setIsSaving] = useState(false)
  const [integrations] = useState({
    whatsapp: true,
    supabase: true,
    n8n: true
  })

  // ─── Existing handlers (unchanged) ───────────────────────────────────────
  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      addToast({
        title: 'Ajustes guardados',
        description: 'La configuración se actualizó correctamente.',
        type: 'success'
      })
    }, 1000)
  }

  const handleIntegrationClick = (key: string) => {
    addToast({
      title: 'Acción no permitida',
      description: `La configuración de ${key.toUpperCase()} está reservada para administración interna de FAIREX.`,
      type: 'warning'
    })
  }

  // ─── New: Business Profile handler ───────────────────────────────────────
  const handleBusinessProfileSubmit = async (data: BusinessProfileInput) => {
    const result = await updateBusinessProfile(data)
    if (result.success) {
      router.refresh()
      addToast({ title: 'Perfil guardado', description: 'El perfil del negocio fue actualizado.', type: 'success' })
    } else {
      addToast({ title: 'Error', description: result.error ?? 'Error al guardar', type: 'error' })
    }
    return result
  }

  // ─── New: Services handlers ───────────────────────────────────────────────
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

  // ─── Payment Settings handler ─────────────────────────────────────────────
  const handlePaymentSettingsSubmit = async (data: PaymentSettingsInput) => {
    const result = await upsertPaymentSettings(data)
    if (result.success) router.refresh()
    return result
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Configuración</h1>
          <p className="text-zinc-400">Gestiona los ajustes de tu sistema y agentes IA.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary text-white hover:bg-primary/90 shrink-0"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="bg-black/40 border border-white/10 p-1 w-full flex overflow-x-auto justify-start h-auto rounded-xl">
          <TabsTrigger value="company" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <Building2 className="h-4 w-4 mr-2" /> Datos de Empresa
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <Palette className="h-4 w-4 mr-2" /> Branding
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <Brain className="h-4 w-4 mr-2" /> Ajustes IA
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <LinkIcon className="h-4 w-4 mr-2" /> Integraciones
          </TabsTrigger>
          {/* New tabs */}
          <TabsTrigger value="business" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <Briefcase className="h-4 w-4 mr-2" /> Mi Negocio
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <Layers className="h-4 w-4 mr-2" /> Servicios
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 py-2.5">
            <CreditCard className="h-4 w-4 mr-2" /> Pagos
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Datos de Empresa — unchanged */}
        <TabsContent value="company">
          <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Información General</CardTitle>
              <CardDescription className="text-zinc-400">Detalles públicos de la empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nombre de la Empresa</Label>
                  <Input 
                    value={company.name} 
                    onChange={(e) => updateCompany({ name: e.target.value })}
                    className="bg-black/50 border-white/10 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Sitio Web</Label>
                  <Input 
                    value={company.website} 
                    onChange={(e) => updateCompany({ website: e.target.value })}
                    className="bg-black/50 border-white/10 text-white" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-zinc-300">Dirección</Label>
                  <Input 
                    value={company.address} 
                    onChange={(e) => updateCompany({ address: e.target.value })}
                    className="bg-black/50 border-white/10 text-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Branding — unchanged */}
        <TabsContent value="branding">
          <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Branding y White Label</CardTitle>
              <CardDescription className="text-zinc-400">Personaliza los colores y el logotipo de tu plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Color Primario (Hex)</Label>
                <div className="flex gap-4 items-center">
                  <Input 
                    value={branding.primaryColor} 
                    onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                    className="w-32 bg-black/50 border-white/10 text-white font-mono" 
                  />
                  <div 
                    className="h-8 w-8 rounded-full border border-white/20" 
                    style={{ backgroundColor: branding.primaryColor || '#10b981' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Logotipo URL</Label>
                <Input 
                  value={branding.logoUrl} 
                  onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                  placeholder="https://fairex.com/logo.png" 
                  className="bg-black/50 border-white/10 text-white max-w-md" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Ajustes IA — unchanged */}
        <TabsContent value="ai">
          <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Cerebro Comercial FAIREX AI</CardTitle>
              <CardDescription className="text-zinc-400">IA configurada y optimizada por especialistas de FAIREX para maximizar resultados comerciales.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">Configuración Avanzada de IA</h3>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">
                  Administrado por FAIREX
                </p>
                <p className="text-sm text-zinc-400 max-w-md mx-auto mb-2 leading-relaxed">
                  La configuración avanzada, comportamiento, estrategias de conversación y optimización del agente son gestionadas por el equipo de FAIREX para garantizar el máximo rendimiento comercial y la mejor experiencia para cada empresa.
                </p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6 italic">
                  Cada agente es configurado y optimizado específicamente para el modelo de negocio, procesos comerciales y objetivos de cada empresa.
                </p>
                <Button variant="outline" className="border-white/10 text-white bg-black/40 hover:bg-white/10">
                  <Headset className="mr-2 h-4 w-4" /> Solicitar ajuste de IA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Integraciones — unchanged */}
        <TabsContent value="integrations">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Supabase */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className={`border transition-all h-full ${integrations.supabase ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-black/40 border-white/10'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${integrations.supabase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                      <Database className="h-6 w-6" />
                    </div>
                    <div onClick={() => handleIntegrationClick('supabase')} className="cursor-not-allowed flex items-center gap-2">
                      <Lock className="h-3 w-3 text-zinc-500" />
                      <Switch 
                        checked={integrations.supabase} 
                        disabled
                        className="data-[state=checked]:bg-emerald-500/50 opacity-50 pointer-events-none"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-white mt-4">Supabase DB</CardTitle>
                  <CardDescription className="text-zinc-400">Almacenamiento de Leads y CRM en tiempo real.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <div className={`h-2 w-2 rounded-full ${integrations.supabase ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-600'}`} />
                    <span className={integrations.supabase ? 'text-emerald-400' : 'text-zinc-500'}>
                      {integrations.supabase ? 'Conectado y Sincronizando' : 'Desconectado'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-white/5">🔒 Reservado para administración interna.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* n8n */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className={`border transition-all h-full ${integrations.n8n ? 'bg-blue-500/5 border-blue-500/30' : 'bg-black/40 border-white/10'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${integrations.n8n ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-400'}`}>
                      <Workflow className="h-6 w-6" />
                    </div>
                    <div onClick={() => handleIntegrationClick('n8n')} className="cursor-not-allowed flex items-center gap-2">
                      <Lock className="h-3 w-3 text-zinc-500" />
                      <Switch 
                        checked={integrations.n8n} 
                        disabled
                        className="data-[state=checked]:bg-blue-500/50 opacity-50 pointer-events-none"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-white mt-4">n8n Workflows</CardTitle>
                  <CardDescription className="text-zinc-400">Automatización de mensajería y procesamiento de IA.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <div className={`h-2 w-2 rounded-full ${integrations.n8n ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-zinc-600'}`} />
                    <span className={integrations.n8n ? 'text-blue-400' : 'text-zinc-500'}>
                      {integrations.n8n ? 'Webhooks Activos' : 'Desconectado'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-white/5">🔒 Reservado para administración interna.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* WhatsApp */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className={`border transition-all h-full ${integrations.whatsapp ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-black/40 border-white/10'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${integrations.whatsapp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div onClick={() => handleIntegrationClick('whatsapp')} className="cursor-not-allowed flex items-center gap-2">
                      <Lock className="h-3 w-3 text-zinc-500" />
                      <Switch 
                        checked={integrations.whatsapp} 
                        disabled
                        className="data-[state=checked]:bg-emerald-500/50 opacity-50 pointer-events-none"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-white mt-4">WhatsApp Cloud</CardTitle>
                  <CardDescription className="text-zinc-400">Canal principal de comunicación Inbound/Outbound.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <div className={`h-2 w-2 rounded-full ${integrations.whatsapp ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-600'}`} />
                    <span className={integrations.whatsapp ? 'text-emerald-400' : 'text-zinc-500'}>
                      {integrations.whatsapp ? 'Número Verificado' : 'Desconectado'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-white/5">🔒 Reservado para administración interna.</p>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </TabsContent>

        {/* Pestaña: Mi Negocio — NEW */}
        <TabsContent value="business">
          <BusinessProfileForm
            initialData={initialBusinessProfile}
            onSubmit={handleBusinessProfileSubmit}
          />
        </TabsContent>

        {/* Pestaña: Servicios — NEW */}
        <TabsContent value="services">
          <ServicesManager
            services={initialServices}
            onCreate={handleCreateService}
            onUpdate={handleUpdateService}
            onToggle={handleToggleService}
          />
        </TabsContent>

        {/* Pestaña: Pagos — NEW */}
        <TabsContent value="payments">
          <PaymentSettingsForm
            initialData={initialPaymentSettings}
            onSubmit={handlePaymentSettingsSubmit}
          />
        </TabsContent>

      </Tabs>
    </div>
  )
}
