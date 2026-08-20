'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUserCompanyId } from '@/lib/services/queries';
import {
  PaymentSettingsInputSchema,
  PaymentSettingsInput,
  PaymentSettingsRow,
} from '@/types/payments';

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentSettings
// Obtiene la configuración bancaria de la empresa del usuario autenticado.
// Devuelve null si todavía no existe una fila (empresa nueva).
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentSettings(): Promise<{
  success: boolean;
  data?: PaymentSettingsRow | null;
  error?: string;
}> {
  try {
    const supabase    = await createClient();
    const companyId   = await requireUserCompanyId(supabase);

    const { data, error } = await supabase
      .from('company_payment_settings')
      .select('id, bank_name, account_holder, clabe, account_number, instructions, is_active, created_at, updated_at')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      console.error('[getPaymentSettings] Error:', error.message);
      return { success: false, error: 'Error al cargar la configuración de pagos' };
    }

    return { success: true, data: data as PaymentSettingsRow | null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[getPaymentSettings] Exception:', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// upsertPaymentSettings
// Crea o actualiza la configuración bancaria de la empresa del usuario.
// Se evita upsert() (ON CONFLICT DO UPDATE) porque la DB rechaza actualizar company_id.
// Se verifica la existencia primero y luego se hace INSERT o UPDATE según corresponda.
// company_id se obtiene exclusivamente del servidor — nunca del formulario.
// ─────────────────────────────────────────────────────────────────────────────
export async function upsertPaymentSettings(input: PaymentSettingsInput): Promise<{
  success: boolean;
  data?: PaymentSettingsRow;
  error?: string;
}> {
  try {
    const supabase  = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const parsed = PaymentSettingsInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    // 1. Comprobar existencia
    const { data: existing } = await supabase
      .from('company_payment_settings')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    let resultData;
    let resultError;

    if (!existing) {
      // 2. Si no existe, hacemos INSERT (incluyendo company_id)
      const { data, error } = await supabase
        .from('company_payment_settings')
        .insert({
          company_id:     companyId,
          bank_name:      parsed.data.bank_name,
          account_holder: parsed.data.account_holder,
          clabe:          parsed.data.clabe ?? null,
          account_number: parsed.data.account_number ?? null,
          instructions:   parsed.data.instructions ?? null,
          is_active:      parsed.data.is_active ?? true,
        })
        .select('id, bank_name, account_holder, clabe, account_number, instructions, is_active, created_at, updated_at')
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
        .eq('company_id', companyId)
        .select('id, bank_name, account_holder, clabe, account_number, instructions, is_active, created_at, updated_at')
        .single();
        
      resultData = data;
      resultError = error;
    }

    if (resultError) {
      console.error(`[upsertPaymentSettings] Error (${resultError.code}):`, resultError.message, resultError.details);
      return { success: false, error: 'Error al guardar la configuración de pagos' };
    }

    return { success: true, data: resultData as PaymentSettingsRow };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    console.error('[upsertPaymentSettings] Exception:', message);
    return { success: false, error: message };
  }
}
