'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUserCompanyId } from '@/lib/services/queries';
import {
  RegisterPaymentInputSchema,
  RegisterPaymentInput,
  PaymentRow,
  CancelPaymentInputSchema,
  CancelPaymentInput,
} from '@/types/payments';

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentsForLead
// Lista todos los pagos de un lead específico para la empresa del usuario.
// company_id se resuelve del servidor — nunca del formulario.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentsForLead(leadId: string): Promise<{
  success: boolean;
  data?: PaymentRow[];
  error?: string;
}> {
  try {
    if (!leadId || leadId.trim() === '') {
      return { success: false, error: 'leadId requerido' };
    }

    const supabase  = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const { data, error } = await supabase
      .from('payments')
      .select('id, lead_session_id, service_id, concept, amount, currency, status, confirmed_at, confirmed_by, cancelled_at, cancelled_by, notes, created_at')
      .eq('company_id', companyId)
      .eq('lead_session_id', leadId.trim())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPaymentsForLead] Error:', error.message);
      return { success: false, error: 'Error al cargar los pagos' };
    }

    return { success: true, data: (data ?? []) as PaymentRow[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[getPaymentsForLead] Exception:', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// registerPayment
// Registra un pago confirmado manualmente por un operador.
// confirmed_by es fijado en servidor vía auth.uid().
// status y confirmed_at son provistos por los DEFAULTs de la DB — no se envían en el payload.
// company_id se obtiene exclusivamente de requireUserCompanyId — nunca del input.
// ─────────────────────────────────────────────────────────────────────────────
export async function registerPayment(input: RegisterPaymentInput): Promise<{
  success: boolean;
  data?: PaymentRow;
  error?: string;
}> {
  try {
    const supabase  = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    // Obtener el usuario actual para confirmed_by
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Sesión no válida' };
    }

    const parsed = RegisterPaymentInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Barrera anti cross-tenant para service_id (segunda línea de defensa tras RLS).
    // La RLS INSERT también lo valida, pero verificamos aquí para un error claro al usuario.
    if (parsed.data.service_id) {
      const { data: svc, error: svcError } = await supabase
        .from('company_services')
        .select('id')
        .eq('id', parsed.data.service_id)
        .eq('company_id', companyId)
        .maybeSingle();
      if (svcError || !svc) {
        return { success: false, error: 'El servicio seleccionado no pertenece a esta empresa' };
      }
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        company_id:      companyId,
        lead_session_id: parsed.data.lead_session_id.trim(),
        service_id:      parsed.data.service_id ?? null,
        concept:         parsed.data.concept,
        amount:          parsed.data.amount,
        currency:        parsed.data.currency,
        confirmed_by:    user.id,
        notes:           parsed.data.notes ?? null,
        // status DEFAULT 'confirmed' y confirmed_at DEFAULT now() los provee la DB.
      })
      .select('id, lead_session_id, service_id, concept, amount, currency, status, confirmed_at, confirmed_by, cancelled_at, cancelled_by, notes, created_at')
      .single();

    if (error) {
      console.error('[registerPayment] Error:', error.message);
      return { success: false, error: 'Error al registrar el pago' };
    }

    return { success: true, data: data as PaymentRow };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[registerPayment] Exception:', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// cancelPayment
// Marca un pago existente como cancelado.
// Solo permite cambiar status, cancelled_at, cancelled_by, notes.
// Los campos de identidad del pago (amount, concept, lead_session_id, etc.) no se tocan.
// company_id se valida en el servidor para evitar cancelar pagos de otra empresa.
// ─────────────────────────────────────────────────────────────────────────────
export async function cancelPayment(input: CancelPaymentInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase  = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Sesión no válida' };
    }

    const parsed = CancelPaymentInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Solo cancelar pagos que estén actualmente confirmados — evitar doble cancelación
    const { error } = await supabase
      .from('payments')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        notes:        parsed.data.notes ?? null,
      })
      .eq('id', parsed.data.payment_id)
      .eq('company_id', companyId)    // Doble guard: solo cancela pagos de SU empresa
      .eq('status', 'confirmed');     // Solo cancela pagos que estén confirmados

    if (error) {
      console.error('[cancelPayment] Error:', error.message);
      return { success: false, error: 'Error al cancelar el pago' };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[cancelPayment] Exception:', message);
    return { success: false, error: message };
  }
}
