'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/superadmin';
import {
  RegisterPaymentInputSchema,
  RegisterPaymentInput,
  PaymentRecord,
  CancelPaymentInputSchema,
  CancelPaymentInput,
} from '@/types/payments';

function validateCompanyId(companyId: unknown): number | null {
  const n = Number(companyId);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentsForLeadAdmin
// Super Admin: lista todos los pagos de un lead en cualquier empresa.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentsForLeadAdmin(
  companyId: number,
  leadId: string
): Promise<{
  success: boolean;
  data?: PaymentRecord[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) return { success: false, error: auth.error };

    const cid = validateCompanyId(companyId);
    if (!cid) return { success: false, error: 'companyId inválido' };

    if (!leadId || leadId.trim() === '') {
      return { success: false, error: 'leadId requerido' };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('payments')
      .select('id, company_id, lead_session_id, service_id, concept, amount, currency, status, confirmed_at, confirmed_by, cancelled_at, cancelled_by, notes, created_at')
      .eq('company_id', cid)
      .eq('lead_session_id', leadId.trim())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPaymentsForLeadAdmin] Error:', error.message);
      return { success: false, error: 'Error al cargar los pagos' };
    }

    return { success: true, data: (data ?? []) as PaymentRecord[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[getPaymentsForLeadAdmin] Exception:', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// registerPaymentAdmin
// Super Admin: registra un pago confirmado en cualquier empresa.
// confirmed_by es el Super Admin autenticado (auth.user.id).
// status y confirmed_at son provistos por los DEFAULTs de la DB — no se envían en el payload.
// ─────────────────────────────────────────────────────────────────────────────
export async function registerPaymentAdmin(
  companyId: number,
  input: RegisterPaymentInput
): Promise<{
  success: boolean;
  data?: PaymentRecord;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) return { success: false, error: auth.error };

    const cid = validateCompanyId(companyId);
    if (!cid) return { success: false, error: 'companyId inválido' };

    const parsed = RegisterPaymentInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const supabase = createAdminClient();

    // Barrera anti cross-tenant para service_id: el servicio debe pertenecer al cid administrado.
    if (parsed.data.service_id) {
      const { data: svc, error: svcError } = await supabase
        .from('company_services')
        .select('id')
        .eq('id', parsed.data.service_id)
        .eq('company_id', cid)
        .maybeSingle();
      if (svcError || !svc) {
        return { success: false, error: 'El servicio seleccionado no pertenece a la empresa indicada' };
      }
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        company_id:      cid,
        lead_session_id: parsed.data.lead_session_id.trim(),
        service_id:      parsed.data.service_id ?? null,
        concept:         parsed.data.concept,
        amount:          parsed.data.amount,
        currency:        parsed.data.currency,
        confirmed_by:    auth.user.id,
        notes:           parsed.data.notes ?? null,
        // status DEFAULT 'confirmed' y confirmed_at DEFAULT now() los provee la DB.
      })
      .select('id, company_id, lead_session_id, service_id, concept, amount, currency, status, confirmed_at, confirmed_by, cancelled_at, cancelled_by, notes, created_at')
      .single();

    if (error) {
      console.error('[registerPaymentAdmin] Error:', error.message);
      return { success: false, error: 'Error al registrar el pago' };
    }

    return { success: true, data: data as PaymentRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[registerPaymentAdmin] Exception:', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// cancelPaymentAdmin
// Super Admin: cancela un pago en cualquier empresa.
// ─────────────────────────────────────────────────────────────────────────────
export async function cancelPaymentAdmin(
  companyId: number,
  input: CancelPaymentInput
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) return { success: false, error: auth.error };

    const cid = validateCompanyId(companyId);
    if (!cid) return { success: false, error: 'companyId inválido' };

    const parsed = CancelPaymentInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('payments')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: auth.user.id,
        notes:        parsed.data.notes ?? null,
      })
      .eq('id', parsed.data.payment_id)
      .eq('company_id', cid)         // Guard: solo cancela pagos de esa empresa
      .eq('status', 'confirmed');    // Solo cancela pagos que estén confirmados

    if (error) {
      console.error('[cancelPaymentAdmin] Error:', error.message);
      return { success: false, error: 'Error al cancelar el pago' };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[cancelPaymentAdmin] Exception:', message);
    return { success: false, error: message };
  }
}
