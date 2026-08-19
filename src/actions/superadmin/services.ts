'use server';

import { requireSuperAdmin } from '@/lib/superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { ServiceSchema, type ServiceInput, type CompanyServiceRow } from '@/types/business';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T = void> = { success: boolean; data?: T; error?: string };

const SERVICE_SELECT = 'id, name, description, price, currency, price_type, category, is_active, metadata, created_at, updated_at' as const;

export async function getServicesAdmin(company_id: string): Promise<ActionResponse<CompanyServiceRow[]>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('company_services')
    .select(SERVICE_SELECT)
    .eq('company_id', company_id)
    .order('name', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as CompanyServiceRow[] };
}

export async function createServiceAdmin(company_id: string, input: ServiceInput): Promise<ActionResponse> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = ServiceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const price = (parsed.data.price_type === 'quote' || parsed.data.price_type === 'free')
    ? null : parsed.data.price ?? null;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('company_services')
    .insert({
      company_id,
      name:        parsed.data.name,
      description: parsed.data.description ?? null,
      price,
      currency:    parsed.data.currency,
      price_type:  parsed.data.price_type,
      category:    parsed.data.category ?? null,
      is_active:   parsed.data.is_active ?? true,
      metadata:    parsed.data.metadata ?? {},
    });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/superadmin/companies/${company_id}`);
  return { success: true };
}

export async function updateServiceAdmin(
  company_id: string,
  serviceId: string,
  input: ServiceInput
): Promise<ActionResponse> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = ServiceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const price = (parsed.data.price_type === 'quote' || parsed.data.price_type === 'free')
    ? null : parsed.data.price ?? null;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('company_services')
    .update({
      name:        parsed.data.name,
      description: parsed.data.description ?? null,
      price,
      currency:    parsed.data.currency,
      price_type:  parsed.data.price_type,
      category:    parsed.data.category ?? null,
      metadata:    parsed.data.metadata ?? {},
    })
    .eq('id', serviceId)
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/superadmin/companies/${company_id}`);
  return { success: true };
}

export async function toggleServiceStatusAdmin(
  company_id: string,
  serviceId: string,
  isActive: boolean
): Promise<ActionResponse> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('company_services')
    .update({ is_active: isActive })
    .eq('id', serviceId)
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/superadmin/companies/${company_id}`);
  return { success: true };
}
