'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUserCompanyId } from '@/lib/services/queries';
import { ServiceSchema, type ServiceInput, type CompanyServiceRow } from '@/types/business';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T = void> = { success: boolean; data?: T; error?: string };

const SERVICE_SELECT = 'id, name, description, price, currency, price_type, category, is_active, metadata, created_at, updated_at' as const;

export async function getServices(): Promise<ActionResponse<CompanyServiceRow[]>> {
  const supabase = await createClient();

  let companyId: number;
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch {
    return { success: false, error: 'No autorizado' };
  }

  const { data, error } = await supabase
    .from('company_services')
    .select(SERVICE_SELECT)
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as CompanyServiceRow[] };
}

export async function createService(input: ServiceInput): Promise<ActionResponse> {
  const supabase = await createClient();

  let companyId: number;
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = ServiceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const price = (parsed.data.price_type === 'quote' || parsed.data.price_type === 'free')
    ? null : parsed.data.price ?? null;

  const { error } = await supabase
    .from('company_services')
    .insert({
      company_id: companyId,
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
  revalidatePath('/settings');
  return { success: true };
}

export async function updateService(serviceId: string, input: ServiceInput): Promise<ActionResponse> {
  const supabase = await createClient();

  let companyId: number;
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = ServiceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const price = (parsed.data.price_type === 'quote' || parsed.data.price_type === 'free')
    ? null : parsed.data.price ?? null;

  const { error } = await supabase
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
    .eq('company_id', companyId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function toggleServiceStatus(serviceId: string, isActive: boolean): Promise<ActionResponse> {
  const supabase = await createClient();

  let companyId: number;
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch {
    return { success: false, error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('company_services')
    .update({ is_active: isActive })
    .eq('id', serviceId)
    .eq('company_id', companyId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}
