'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/superadmin';
import {
  PaymentSettingsInputSchema,
  PaymentSettingsInput,
  PaymentSettings,
} from '@/types/payments';

function validateCompanyId(companyId: unknown): number | null {
  const n = Number(companyId);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentSettingsAdmin
// Super Admin: obtiene la configuración bancaria de cualquier empresa.
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentSettingsAdmin(companyId: number): Promise<{
  success: boolean;
  data?: PaymentSettings | null;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) return { success: false, error: auth.error };

    const cid = validateCompanyId(companyId);
    if (!cid) return { success: false, error: 'companyId inválido' };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('company_payment_settings')
      .select('id, company_id, bank_name, account_holder, clabe, account_number, instructions, is_active, created_at, updated_at')
      .eq('company_id', cid)
      .maybeSingle();

    if (error) {
      console.error('[getPaymentSettingsAdmin] Error:', error.message);
      return { success: false, error: 'Error al cargar la configuración de pagos' };
    }

    return { success: true, data: data as PaymentSettings | null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[getPaymentSettingsAdmin] Exception:', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// upsertPaymentSettingsAdmin
// Super Admin: crea o actualiza la configuración bancaria de cualquier empresa.
// ─────────────────────────────────────────────────────────────────────────────
export async function upsertPaymentSettingsAdmin(
  companyId: number,
  input: PaymentSettingsInput
): Promise<{
  success: boolean;
  data?: PaymentSettings;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) return { success: false, error: auth.error };

    const cid = validateCompanyId(companyId);
    if (!cid) return { success: false, error: 'companyId inválido' };

    const parsed = PaymentSettingsInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const supabase = createAdminClient();
    
    // 1. Comprobar existencia
    const { data: existing } = await supabase
      .from('company_payment_settings')
      .select('id')
      .eq('company_id', cid)
      .maybeSingle();

    let resultData;
    let resultError;

    if (!existing) {
      // 2. Si no existe, hacemos INSERT (incluyendo company_id)
      const { data, error } = await supabase
        .from('company_payment_settings')
        .insert({
          company_id:     cid,
          bank_name:      parsed.data.bank_name,
          account_holder: parsed.data.account_holder,
          clabe:          parsed.data.clabe ?? null,
          account_number: parsed.data.account_number ?? null,
          instructions:   parsed.data.instructions ?? null,
          is_active:      parsed.data.is_active ?? true,
        })
        .select('id, company_id, bank_name, account_holder, clabe, account_number, instructions, is_active, created_at, updated_at')
        .single();
        
      resultData = data;
      resultError = error;
    } else {
      // 3. Si existe, hacemos UPDATE excluyendo company_id
      const { data, error } = await supabase
        .from('company_payment_settings')
        .update({
          bank_name:      parsed.data.bank_name,
          account_holder: parsed.data.account_holder,
          clabe:          parsed.data.clabe ?? null,
          account_number: parsed.data.account_number ?? null,
          instructions:   parsed.data.instructions ?? null,
          is_active:      parsed.data.is_active ?? true,
        })
        .eq('company_id', cid)
        .select('id, company_id, bank_name, account_holder, clabe, account_number, instructions, is_active, created_at, updated_at')
        .single();
        
      resultData = data;
      resultError = error;
    }

    if (resultError) {
      console.error(`[upsertPaymentSettingsAdmin] Error (${resultError.code}):`, resultError.message, resultError.details);
      return { success: false, error: 'Error al guardar la configuración de pagos' };
    }

    return { success: true, data: resultData as PaymentSettings };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[upsertPaymentSettingsAdmin] Exception:', message);
    return { success: false, error: message };
  }
}
