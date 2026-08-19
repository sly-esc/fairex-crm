'use client';

import { useState } from 'react';
import type { ServiceInput, CompanyServiceRow } from '@/types/business';
import { ServiceSchema } from '@/types/business';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Precio fijo',
  from: 'Desde',
  quote: 'Requiere cotización',
  free: 'Gratuito',
};

interface ServiceFormProps {
  initialData?: Partial<CompanyServiceRow>;
  onSubmit: (data: ServiceInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function ServiceForm({ initialData, onSubmit, onCancel }: ServiceFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [priceType, setPriceType] = useState<ServiceInput['price_type']>(initialData?.price_type ?? 'fixed');
  const [price, setPrice] = useState<string>(initialData?.price != null ? String(initialData.price) : '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'MXN');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const priceDisabled = priceType === 'quote' || priceType === 'free';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload: ServiceInput = {
      name,
      description: description || null,
      price: priceDisabled ? null : price !== '' ? parseFloat(price) : null,
      currency,
      price_type: priceType,
      category: category || null,
      is_active: isActive,
      // metadata is intentionally omitted so it is preserved server-side
      metadata: initialData?.metadata ?? {},
    };

    const parsed = ServiceSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      setSaving(false);
      return;
    }

    const result = await onSubmit(parsed.data);
    if (result.success) {
      onCancel(); // close form/modal on success
    } else {
      setErrorMsg(result.error ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const inputClass = 'bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-indigo-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-zinc-300">Nombre del Servicio *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ej: Instalación de software" required />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Descripción</Label>
        <textarea
          rows={2}
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
          placeholder="Descripción breve del servicio..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-zinc-300">Tipo de Precio *</Label>
          <select
            value={priceType}
            onChange={(e) => {
              const t = e.target.value as ServiceInput['price_type'];
              setPriceType(t);
              if (t === 'quote' || t === 'free') setPrice('');
            }}
            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            {Object.entries(PRICE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Precio {priceDisabled ? '(no aplica)' : '*'}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceDisabled}
              className={`${inputClass} flex-1 ${priceDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              placeholder="0.00"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-md px-2 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 w-20"
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Categoría</Label>
        <Input value={category ?? ''} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Ej: Instalación, Soporte, Consultoría" />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
          className="data-[state=checked]:bg-indigo-600"
        />
        <Label className="text-zinc-300">{isActive ? 'Activo' : 'Inactivo'}</Label>
      </div>

      <div className="flex gap-3 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 text-zinc-400 hover:text-white">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
