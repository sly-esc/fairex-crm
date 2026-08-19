'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUserCompanyId } from '@/lib/services/queries';
import { BusinessProfileSchema, type BusinessProfileInput } from '@/types/business';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T = void> = { success: boolean; data?: T; error?: string };

export async function getBusinessProfile(): Promise<ActionResponse<BusinessProfileInput>> {
  const supabase = await createClient();

  let companyId: number;
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('company_settings')
    .select('business_profile')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  
  if (!data) {
    return { success: false, error: 'Configuración de empresa no encontrada. Por favor, contacte a soporte técnico.' };
  }
  
  return { success: true, data: (data.business_profile ?? {}) as BusinessProfileInput };
}

export async function updateBusinessProfile(input: BusinessProfileInput): Promise<ActionResponse> {
  const supabase = await createClient();

  let companyId: number;
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = BusinessProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data: current, error: readError } = await supabase
    .from('company_settings')
    .select('business_profile')
    .eq('company_id', companyId)
    .maybeSingle();

  if (readError) return { success: false, error: readError.message };
  
  if (!current) {
    return { success: false, error: 'Configuración de empresa no encontrada. Por favor, contacte a soporte técnico.' };
  }

  const merged = { ...(current.business_profile ?? {}), ...parsed.data };

  const { error: writeError } = await supabase
    .from('company_settings')
    .update({ business_profile: merged })
    .eq('company_id', companyId);

  if (writeError) return { success: false, error: writeError.message };

  revalidatePath('/settings');
  return { success: true };
}
