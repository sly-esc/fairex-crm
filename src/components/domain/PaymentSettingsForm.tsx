'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, CreditCard, ShieldCheck } from 'lucide-react';
import { PaymentSettingsInputSchema } from '@/types/payments';
import type { PaymentSettingsInput, PaymentSettingsRow } from '@/types/payments';

interface PaymentSettingsFormProps {
  /** Datos actuales de la empresa (null = empresa sin configuración previa) */
  initialData?: PaymentSettingsRow | null;
  /** Server Action a llamar al guardar — diferente según Dashboard vs Super Admin */
  onSubmit: (data: PaymentSettingsInput) => Promise<{ success: boolean; error?: string }>;
}

export default function PaymentSettingsForm({ initialData, onSubmit }: PaymentSettingsFormProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── State controlado por campo — nunca pasa company_id ──────────────────
  const [bankName, setBankName]           = useState(initialData?.bank_name      ?? '');
  const [accountHolder, setAccountHolder] = useState(initialData?.account_holder ?? '');
  const [clabe, setClabe]                 = useState(initialData?.clabe          ?? '');
  const [accountNumber, setAccountNumber] = useState(initialData?.account_number ?? '');
  const [instructions, setInstructions]   = useState(initialData?.instructions   ?? '');
  const [isActive, setIsActive]           = useState(initialData?.is_active      ?? true);

  // Privacidad visual — no expone datos en logs ni en DOM visible por defecto
  const [showClabe, setShowClabe]               = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // ─── Validación y envío ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg(null);

    const payload: PaymentSettingsInput = {
      bank_name:      bankName.trim(),
      account_holder: accountHolder.trim(),
      clabe:          clabe.trim()         || null,
      account_number: accountNumber.trim() || null,
      instructions:   instructions.trim()  || null,
      is_active:      isActive,
    };

    // Validación client-side con el mismo schema del backend
    const parsed = PaymentSettingsInputSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus('error');
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    const result = await onSubmit(parsed.data);
    if (result.success) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3500);
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Error al guardar la configuración');
    }
  };

  const inputClass = 'bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      {/* ─── Header descriptivo ────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <CreditCard className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Configuración de cobro</p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            Define los datos que tu asistente podrá compartir cuando un prospecto esté listo para pagar.
          </p>
        </div>
      </div>

      {/* ─── Feedback de estado ────────────────────────────────────────── */}
      {status === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Configuración guardada correctamente</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── Datos bancarios principales ───────────────────────────────── */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Datos bancarios</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Nombre del banco y titular de la cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banco */}
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Banco <span className="text-red-400">*</span>
              </Label>
              <Input
                id="payment-bank-name"
                name="bank_name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={inputClass}
                placeholder="Ej: BBVA, Banorte, HSBC"
                autoComplete="off"
                required
              />
            </div>
            {/* Titular */}
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Titular / Beneficiario <span className="text-red-400">*</span>
              </Label>
              <Input
                id="payment-account-holder"
                name="account_holder"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className={inputClass}
                placeholder="Nombre completo o razón social"
                autoComplete="off"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── CLABE y número de cuenta (con toggle de visibilidad) ──────── */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Cuenta</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Proporciona al menos una CLABE o un número de cuenta cuando la configuración esté activa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CLABE */}
            <div className="space-y-2">
              <Label className="text-zinc-300">CLABE</Label>
              <div className="relative">
                <Input
                  id="payment-clabe"
                  name="clabe"
                  type={showClabe ? 'text' : 'password'}
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="18 dígitos"
                  autoComplete="new-password"
                  maxLength={18}
                />
                <button
                  type="button"
                  onClick={() => setShowClabe((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showClabe ? 'Ocultar CLABE' : 'Mostrar CLABE'}
                >
                  {showClabe ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* Número de cuenta */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Número de cuenta</Label>
              <div className="relative">
                <Input
                  id="payment-account-number"
                  name="account_number"
                  type={showAccountNumber ? 'text' : 'password'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Número de cuenta"
                  autoComplete="new-password"
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={() => setShowAccountNumber((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showAccountNumber ? 'Ocultar número de cuenta' : 'Mostrar número de cuenta'}
                >
                  {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Instrucciones adicionales ─────────────────────────────────── */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Instrucciones adicionales</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Indicaciones opcionales que el asistente puede añadir al compartir los datos de pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            id="payment-instructions"
            name="instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Ej: Incluir nombre del cliente en la referencia de la transferencia..."
            autoComplete="off"
            maxLength={1000}
          />
          <p className="text-xs text-zinc-600 mt-1 text-right">{instructions.length}/1000</p>
        </CardContent>
      </Card>

      {/* ─── Estado activo + botón guardar ────────────────────────────── */}
      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="payment-is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-indigo-600"
              />
              <div>
                <Label htmlFor="payment-is-active" className="text-zinc-300 cursor-pointer">
                  {isActive ? 'Datos de cobro activos' : 'Datos de cobro inactivos'}
                </Label>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isActive
                    ? 'El asistente puede compartir estos datos con los prospectos.'
                    : 'El asistente no compartirá datos de pago.'}
                </p>
              </div>
            </div>
            {/* Guardar */}
            <Button
              type="submit"
              disabled={status === 'saving'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] shrink-0"
            >
              {status === 'saving' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Guardar configuración</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Aviso de privacidad ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>Los datos bancarios se almacenan de forma segura y solo están disponibles para tu empresa.</span>
      </div>
    </form>
  );
}
