'use client';

import { useState } from 'react';
import type { ServiceInput, CompanyServiceRow } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import ServiceForm from './ServiceForm';

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Precio fijo',
  from: 'Desde',
  quote: 'Por cotizar',
  free: 'Gratis',
};

function formatPrice(service: CompanyServiceRow): string {
  if (service.price_type === 'quote') return 'Por cotizar';
  if (service.price_type === 'free') return 'Gratis';
  if (service.price == null) return '—';
  const formatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: service.currency }).format(service.price);
  return service.price_type === 'from' ? `Desde ${formatted}` : formatted;
}

interface ServicesManagerProps {
  services: CompanyServiceRow[];
  onCreate: (input: ServiceInput) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (serviceId: string, input: ServiceInput) => Promise<{ success: boolean; error?: string }>;
  onToggle: (serviceId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; service: CompanyServiceRow };

export default function ServicesManager({ services, onCreate, onUpdate, onToggle }: ServicesManagerProps) {
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [toggling, setToggling] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggle = async (service: CompanyServiceRow) => {
    setToggling(service.id);
    setToggleError(null);
    const result = await onToggle(service.id, !service.is_active);
    if (!result.success) {
      setToggleError(result.error ?? 'Error al cambiar estado');
    }
    setToggling(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-zinc-400">{services.length} servicio(s) configurado(s)</p>
        <Button
          onClick={() => setModal({ mode: 'create' })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
        </Button>
      </div>

      {toggleError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {toggleError}
        </div>
      )}

      {services.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-zinc-500">No hay servicios configurados todavía.</p>
          <Button onClick={() => setModal({ mode: 'create' })} variant="outline" size="sm" className="mt-4 border-white/10 text-zinc-400 hover:text-white">
            <Plus className="mr-2 h-4 w-4" /> Agregar primer servicio
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 font-medium">{svc.name}</td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{formatPrice(svc)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{PRICE_TYPE_LABELS[svc.price_type] ?? svc.price_type}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{svc.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`text-xs ${svc.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-700/50 text-zinc-400 border border-white/10'
                      }`}
                    >
                      {svc.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModal({ mode: 'edit', service: svc })}
                        className="text-zinc-400 hover:text-white h-8 px-2"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(svc)}
                        disabled={toggling === svc.id}
                        className={`h-8 px-2 ${svc.is_active ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        title={svc.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {toggling === svc.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : svc.is_active
                            ? <ToggleLeft className="h-3.5 w-3.5" />
                            : <ToggleRight className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">
                {modal.mode === 'create' ? 'Nuevo Servicio' : `Editar: ${modal.service.name}`}
              </h3>
              <button
                onClick={() => setModal({ mode: 'closed' })}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ServiceForm
                initialData={modal.mode === 'edit' ? modal.service : undefined}
                onCancel={() => setModal({ mode: 'closed' })}
                onSubmit={
                  modal.mode === 'create'
                    ? onCreate
                    : (input) => onUpdate(modal.service.id, input)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
