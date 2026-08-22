'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Plus, X, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  getPaymentsForLead,
  registerPayment,
  cancelPayment,
} from '@/actions/dashboard/payments';
import { getServices } from '@/actions/dashboard/services';
import type { PaymentRow } from '@/types/payments';
import type { CompanyServiceRow } from '@/types/business';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CONCEPT_PRESETS = [
  'Anticipo',
  'Saldo',
  'Pago completo',
  'Mensualidad',
  'Otro',
] as const;

type ConceptPreset = (typeof CONCEPT_PRESETS)[number];

// ─── Suggest amount ───────────────────────────────────────────────────────────

function suggestAmount(
  service: CompanyServiceRow | null,
  conceptPreset: ConceptPreset | null
): number | null {
  if (!service) return null;
  if (service.price_type === 'from') return null; // precio "desde" — no asumir
  if (service.price == null) return null;

  const pt = (service.metadata?.payment_terms as Record<string, any> | undefined);

  if (conceptPreset === 'Pago completo') {
    if (pt?.payment_type === 'full_upfront') {
      const maint = (service.metadata?.monthly_maintenance as { price?: number; required?: boolean } | undefined);
      if (pt.include_first_required_maintenance && maint?.required && maint.price != null) {
        return service.price + maint.price;
      }
    }
    return service.price;
  }

  if (conceptPreset === 'Anticipo') {
    if (pt?.payment_type === 'split' && typeof pt.upfront_percentage === 'number') {
      return Math.round(service.price * pt.upfront_percentage) / 100;
    }
    return null;
  }

  if (conceptPreset === 'Saldo') {
    if (pt?.payment_type === 'split' && typeof pt.upfront_percentage === 'number') {
      const anticipo = Math.round(service.price * pt.upfront_percentage) / 100;
      return service.price - anticipo;
    }
    return null;
  }

  if (conceptPreset === 'Mensualidad') {
    const maint = (service.metadata?.monthly_maintenance as { price?: number } | undefined)
      ?? (service.metadata?.optional_monthly_maintenance as { price?: number } | undefined);
    if (maint?.price != null) return maint.price;
    return null;
  }

  return null;
}

// ─── Register Modal ───────────────────────────────────────────────────────────

interface RegisterModalProps {
  leadSessionId: string;
  services: CompanyServiceRow[];
  onClose: () => void;
  onSuccess: () => void;
}

function RegisterModal({ leadSessionId, services, onClose, onSuccess }: RegisterModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [conceptPreset, setConceptPreset]         = useState<ConceptPreset | null>(null);
  const [customConcept, setCustomConcept]         = useState('');
  const [amount, setAmount]                       = useState('');
  const [currency, setCurrency]                   = useState('MXN');
  const [notes, setNotes]                         = useState('');
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  const selectedService = services.find(s => s.id === selectedServiceId) ?? null;

  // Auto-suggest amount when service or concept changes
  useEffect(() => {
    if (conceptPreset && conceptPreset !== 'Otro') {
      const suggested = suggestAmount(selectedService, conceptPreset);
      if (suggested != null) {
        setAmount(String(suggested));
      }
    }
  }, [selectedServiceId, conceptPreset, selectedService]);

  // Auto-set currency from service
  useEffect(() => {
    if (selectedService) setCurrency(selectedService.currency ?? 'MXN');
  }, [selectedServiceId, selectedService]);

  function buildConcept(): string {
    if (conceptPreset === 'Otro') return customConcept.trim();
    if (!conceptPreset) return '';
    const svcName = selectedService?.name ?? null;
    return svcName ? `${conceptPreset} - ${svcName}` : conceptPreset;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const concept = buildConcept();
    if (!concept) { setError('Selecciona o escribe un concepto'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('El monto debe ser mayor a cero'); return; }

    setSaving(true);
    const result = await registerPayment({
      lead_session_id: leadSessionId,
      service_id:      selectedServiceId || null,
      concept,
      amount:          parseFloat(amount),
      currency,
      notes:           notes || null,
    });
    setSaving(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error ?? 'Error al registrar el pago');
    }
  }

  const inputClass = 'bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500';
  const selectClass = 'w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Registrar pago recibido</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Servicio */}
          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Servicio</Label>
            <select
              value={selectedServiceId}
              onChange={e => { setSelectedServiceId(e.target.value); setConceptPreset(null); setAmount(''); }}
              className={selectClass}
            >
              <option value="">Sin servicio asociado</option>
              {services.filter(s => s.is_active).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {selectedService && selectedService.price_type === 'from' && (
              <p className="text-xs text-amber-400 mt-1">
                Precio del servicio desde {fmt(selectedService.price ?? 0, selectedService.currency)} — confirma el monto real abajo.
              </p>
            )}
          </div>

          {/* Concepto */}
          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Concepto *</Label>
            <div className="flex flex-wrap gap-2">
              {CONCEPT_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setConceptPreset(preset); if (preset !== 'Otro') setCustomConcept(''); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    conceptPreset === preset
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            {conceptPreset === 'Otro' && (
              <Input
                value={customConcept}
                onChange={e => setCustomConcept(e.target.value)}
                className={`${inputClass} mt-2`}
                placeholder="Describe el concepto del pago..."
                maxLength={300}
                required
              />
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Monto *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="0.00"
                required
              />
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-md px-2 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 w-20"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label className="text-zinc-300 text-sm">Notas (opcional)</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Número de comprobante, referencia, etc."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 text-zinc-400 hover:text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !conceptPreset} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px]">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</> : 'Registrar pago'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Cancel Confirm ───────────────────────────────────────────────────────────

interface CancelConfirmProps {
  paymentId: string;
  concept: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CancelConfirm({ paymentId, concept, onClose, onSuccess }: CancelConfirmProps) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    const result = await cancelPayment({ payment_id: paymentId });
    setCancelling(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error ?? 'Error al cancelar');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">¿Cancelar este registro?</h2>
        <p className="text-sm text-zinc-400">
          El pago <span className="text-white font-medium">"{concept}"</span> quedará marcado como cancelado. Esta acción no elimina el registro.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-zinc-400 hover:text-white" disabled={cancelling}>
            Volver
          </Button>
          <Button onClick={handleCancel} disabled={cancelling} className="bg-red-600/80 hover:bg-red-600 text-white min-w-[110px]">
            {cancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...</> : 'Sí, cancelar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

interface LeadPaymentsCardProps {
  /** Identificador funcional del lead: session_key (e.g. "1:529982396709"). */
  leadSessionId: string;
}

export default function LeadPaymentsCard({ leadSessionId }: LeadPaymentsCardProps) {
  const [payments, setPayments]   = useState<PaymentRow[]>([]);
  const [services, setServices]   = useState<CompanyServiceRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showRegister, setShowRegister]                         = useState(false);
  const [cancelTarget, setCancelTarget]                         = useState<PaymentRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [paymentsRes, servicesRes] = await Promise.all([
      getPaymentsForLead(leadSessionId),
      getServices(),
    ]);
    if (!paymentsRes.success) {
      setLoadError(paymentsRes.error ?? 'Error al cargar pagos');
    } else {
      setPayments(paymentsRes.data ?? []);
    }
    if (servicesRes.success) {
      setServices(servicesRes.data ?? []);
    }
    setLoading(false);
  }, [leadSessionId]);

  useEffect(() => { load(); }, [load]);

  const totalConfirmed = payments
    .filter(p => p.status === 'confirmed')
    .reduce((acc, p) => acc + p.amount, 0);

  const defaultCurrency = payments[0]?.currency ?? 'MXN';

  return (
    <>
      {showRegister && (
        <RegisterModal
          leadSessionId={leadSessionId}
          services={services}
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); load(); }}
        />
      )}
      {cancelTarget && (
        <CancelConfirm
          paymentId={cancelTarget.id}
          concept={cancelTarget.concept}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => { setCancelTarget(null); load(); }}
        />
      )}

      <Card className="bg-black/40 backdrop-blur-xl border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" /> Pagos
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowRegister(true)}
              className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Registrar pago
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          )}

          {!loading && loadError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {loadError}
            </div>
          )}

          {!loading && !loadError && payments.length === 0 && (
            <div className="text-center py-6 space-y-3">
              <DollarSign className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-500">No hay pagos registrados</p>
              <Button
                size="sm"
                onClick={() => setShowRegister(true)}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Registrar pago recibido
              </Button>
            </div>
          )}

          {!loading && !loadError && payments.length > 0 && (
            <>
              {/* Summary */}
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <span className="text-xs text-zinc-400">Total confirmado</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {fmt(totalConfirmed, defaultCurrency)}
                </span>
              </div>

              <Separator className="bg-white/5" />

              {/* Payment list */}
              <div className="space-y-2">
                {payments.map(payment => (
                  <div
                    key={payment.id}
                    className={`rounded-lg border p-3 space-y-1 transition-colors ${
                      payment.status === 'cancelled'
                        ? 'border-white/5 bg-white/2 opacity-60'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {payment.status === 'confirmed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{payment.concept}</p>
                          <p className="text-xs text-zinc-500">{fmtDate(payment.confirmed_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-semibold ${payment.status === 'cancelled' ? 'text-zinc-500 line-through' : 'text-white'}`}>
                          {fmt(payment.amount, payment.currency)}
                        </span>
                        <Badge
                          className={`text-xs px-2 py-0.5 ${
                            payment.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {payment.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-zinc-500 pl-6 italic">{payment.notes}</p>
                    )}
                    {payment.status === 'confirmed' && (
                      <div className="pl-6 pt-0.5">
                        <button
                          onClick={() => setCancelTarget(payment)}
                          className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          Cancelar registro
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
