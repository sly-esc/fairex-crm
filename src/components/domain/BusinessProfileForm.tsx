'use client';

import { useState } from 'react';
import type { BusinessProfileInput } from '@/types/business';
import { BusinessProfileSchema } from '@/types/business';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BusinessProfileFormProps {
  initialData?: Partial<BusinessProfileInput>;
  onSubmit: (data: BusinessProfileInput) => Promise<{ success: boolean; error?: string }>;
  isReadOnly?: boolean;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function getInitialHours(data?: Partial<BusinessProfileInput>) {
  if (data?.business_hours && data.business_hours.length > 0) return data.business_hours;
  return DAYS.map((day) => ({ day, open: '09:00', close: '18:00', is_open: day !== 'Domingo' }));
}

export default function BusinessProfileForm({ initialData, onSubmit, isReadOnly = false }: BusinessProfileFormProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Main fields ---
  const [businessName, setBusinessName] = useState(initialData?.business_name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [website, setWebsite] = useState(initialData?.website ?? '');

  // --- Contact arrays ---
  const [phones, setPhones] = useState<string[]>(initialData?.phones ?? ['']);
  const [emails, setEmails] = useState<string[]>(initialData?.emails ?? ['']);

  // --- Service areas ---
  const [serviceAreas, setServiceAreas] = useState<string[]>(initialData?.service_areas ?? ['']);

  // --- Business hours ---
  const [businessHours, setBusinessHours] = useState(getInitialHours(initialData));

  // --- Commercial info ---
  const [paymentMethods, setPaymentMethods] = useState<string[]>(initialData?.payment_methods ?? ['']);
  const [purchaseProcess, setPurchaseProcess] = useState(initialData?.purchase_process ?? '');
  const [policies, setPolicies] = useState(initialData?.policies ?? '');

  // --- FAQs ---
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(
    initialData?.faqs ?? [{ question: '', answer: '' }]
  );

  // --- Other ---
  const [humanHandoff, setHumanHandoff] = useState(initialData?.human_handoff ?? '');
  const [additionalInfo, setAdditionalInfo] = useState(initialData?.additional_information ?? '');

  // --- Array helpers ---
  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => [...prev, '']);
  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) =>
    setter((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) =>
    setter((prev) => prev.map((v, i) => (i === idx ? val : v)));

  const updateHour = (idx: number, field: 'open' | 'close' | 'is_open', val: string | boolean) =>
    setBusinessHours((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: val } : h)));

  const addFaq = () => setFaqs((prev) => [...prev, { question: '', answer: '' }]);
  const removeFaq = (idx: number) => setFaqs((prev) => prev.filter((_, i) => i !== idx));
  const updateFaq = (idx: number, field: 'question' | 'answer', val: string) =>
    setFaqs((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg(null);

    const payload: BusinessProfileInput = {
      business_name: businessName || null,
      description: description || null,
      address: address || null,
      website: website || null,
      phones: phones.filter(Boolean),
      emails: emails.filter(Boolean),
      service_areas: serviceAreas.filter(Boolean),
      business_hours: businessHours,
      payment_methods: paymentMethods.filter(Boolean),
      purchase_process: purchaseProcess || null,
      policies: policies || null,
      faqs: faqs.filter((f) => f.question.trim() || f.answer.trim()),
      human_handoff: humanHandoff || null,
      additional_information: additionalInfo || null,
    };

    const parsed = BusinessProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus('error');
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    const result = await onSubmit(parsed.data);
    if (result.success) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Error al guardar');
    }
  };

  const inputClass = `bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`;
  const textareaClass = `w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status feedback */}
      {status === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Perfil guardado correctamente</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sección 1: Datos principales */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Datos Principales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nombre Comercial</Label>
              <Input value={businessName ?? ''} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} placeholder="Ej: Ferretería La Moderna" readOnly={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Sitio Web</Label>
              <Input value={website ?? ''} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://miempresa.com" readOnly={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Dirección</Label>
              <Input value={address ?? ''} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Calle, Colonia, Ciudad" readOnly={isReadOnly} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Descripción del Negocio</Label>
            <textarea rows={3} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} className={textareaClass} placeholder="Describe tu negocio, propuesta de valor..." readOnly={isReadOnly} />
          </div>
        </CardContent>
      </Card>

      {/* Sección 2: Contacto */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teléfonos */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Teléfonos</Label>
            {phones.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input value={p} onChange={(e) => updateItem(setPhones, i, e.target.value)} className={inputClass} placeholder="+52 55 0000 0000" readOnly={isReadOnly} />
                {!isReadOnly && phones.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(setPhones, i)} className="text-zinc-500 hover:text-red-400 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button type="button" variant="outline" size="sm" onClick={() => addItem(setPhones)} className="border-white/10 text-zinc-400 hover:text-white">
                <Plus className="h-3 w-3 mr-1" /> Agregar teléfono
              </Button>
            )}
          </div>
          {/* Correos */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Correos Electrónicos</Label>
            {emails.map((e, i) => (
              <div key={i} className="flex gap-2">
                <Input value={e} onChange={(ev) => updateItem(setEmails, i, ev.target.value)} className={inputClass} placeholder="contacto@empresa.com" type="email" readOnly={isReadOnly} />
                {!isReadOnly && emails.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(setEmails, i)} className="text-zinc-500 hover:text-red-400 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button type="button" variant="outline" size="sm" onClick={() => addItem(setEmails)} className="border-white/10 text-zinc-400 hover:text-white">
                <Plus className="h-3 w-3 mr-1" /> Agregar correo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sección 3: Zonas de Servicio */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Zonas de Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {serviceAreas.map((area, i) => (
            <div key={i} className="flex gap-2">
              <Input value={area} onChange={(e) => updateItem(setServiceAreas, i, e.target.value)} className={inputClass} placeholder="Ej: Zona Centro CDMX" readOnly={isReadOnly} />
              {!isReadOnly && serviceAreas.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(setServiceAreas, i)} className="text-zinc-500 hover:text-red-400 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!isReadOnly && (
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setServiceAreas)} className="border-white/10 text-zinc-400 hover:text-white">
              <Plus className="h-3 w-3 mr-1" /> Agregar zona
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sección 4: Horarios */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Horarios de Atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {businessHours.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="w-24 text-sm text-zinc-400 shrink-0">{h.day}</span>
              <div className="flex items-center gap-2">
                <Switch checked={h.is_open} onCheckedChange={(v) => !isReadOnly && updateHour(i, 'is_open', v)} disabled={isReadOnly} className="data-[state=checked]:bg-indigo-600" />
                <span className="text-xs text-zinc-500">{h.is_open ? 'Abierto' : 'Cerrado'}</span>
              </div>
              <input type="time" value={h.open} disabled={!h.is_open || isReadOnly} onChange={(e) => updateHour(i, 'open', e.target.value)} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-zinc-300 disabled:opacity-40" />
              <span className="text-zinc-600 text-xs">–</span>
              <input type="time" value={h.close} disabled={!h.is_open || isReadOnly} onChange={(e) => updateHour(i, 'close', e.target.value)} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-zinc-300 disabled:opacity-40" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sección 5: Información Comercial */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Información Comercial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-300">Métodos de Pago</Label>
            <p className="text-xs text-zinc-500">Ej: Transferencia, Efectivo, Tarjeta de crédito/débito</p>
            {paymentMethods.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Input value={m} onChange={(e) => updateItem(setPaymentMethods, i, e.target.value)} className={inputClass} placeholder="Ej: Transferencia bancaria" readOnly={isReadOnly} />
                {!isReadOnly && paymentMethods.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(setPaymentMethods, i)} className="text-zinc-500 hover:text-red-400 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button type="button" variant="outline" size="sm" onClick={() => addItem(setPaymentMethods)} className="border-white/10 text-zinc-400 hover:text-white">
                <Plus className="h-3 w-3 mr-1" /> Agregar método
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Proceso de Compra</Label>
            <textarea rows={3} value={purchaseProcess ?? ''} onChange={(e) => setPurchaseProcess(e.target.value)} className={textareaClass} placeholder="Describe cómo se realiza una compra o contratación..." readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Políticas</Label>
            <textarea rows={3} value={policies ?? ''} onChange={(e) => setPolicies(e.target.value)} className={textareaClass} placeholder="Políticas de devolución, garantía, cancelación..." readOnly={isReadOnly} />
          </div>
        </CardContent>
      </Card>

      {/* Sección 6: FAQs */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Preguntas Frecuentes (FAQs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-lg border border-white/5 bg-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-medium">Pregunta {i + 1}</span>
                {!isReadOnly && faqs.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFaq(i)} className="text-zinc-500 hover:text-red-400 h-7 px-2">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} className={inputClass} placeholder="¿Hacen envíos a domicilio?" readOnly={isReadOnly} />
              <textarea rows={2} value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} className={textareaClass} placeholder="Sí, hacemos envíos a toda la república..." readOnly={isReadOnly} />
            </div>
          ))}
          {!isReadOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addFaq} className="border-white/10 text-zinc-400 hover:text-white">
              <Plus className="h-3 w-3 mr-1" /> Agregar pregunta
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sección 7: Derivación y adicional */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-base">Derivación y Adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Instrucciones de Derivación Humana</Label>
            <textarea rows={2} value={humanHandoff ?? ''} onChange={(e) => setHumanHandoff(e.target.value)} className={textareaClass} placeholder="Cómo y cuándo derivar a un agente humano..." readOnly={isReadOnly} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Información Adicional</Label>
            <textarea rows={3} value={additionalInfo ?? ''} onChange={(e) => setAdditionalInfo(e.target.value)} className={textareaClass} placeholder="Cualquier información adicional relevante para el agente IA..." readOnly={isReadOnly} />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      {!isReadOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={status === 'saving'} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
            {status === 'saving' ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Guardar Perfil</>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
