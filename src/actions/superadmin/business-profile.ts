'use server';

import { requireSuperAdmin } from '@/lib/superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { BusinessProfileSchema, type BusinessProfileInput } from '@/types/business';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T = void> = { success: boolean; data?: T; error?: string };

export async function getBusinessProfileAdmin(company_id: string): Promise<ActionResponse<BusinessProfileInput>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('company_settings')
    .select('business_profile')
    .eq('company_id', company_id)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data?.business_profile ?? {}) as BusinessProfileInput };
}

export async function saveBusinessProfileAdmin(
  company_id: string,
  input: BusinessProfileInput
): Promise<ActionResponse> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = BusinessProfileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const adminClient = createAdminClient();

  const { data: current } = await adminClient
    .from('company_settings')
    .select('business_profile')
    .eq('company_id', company_id)
    .maybeSingle();

  const merged = { ...(current?.business_profile ?? {}), ...parsed.data };

  const { error } = await adminClient
    .from('company_settings')
    .upsert({ company_id, business_profile: merged }, { onConflict: 'company_id' });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/superadmin/companies/${company_id}`);
  return { success: true };
}
