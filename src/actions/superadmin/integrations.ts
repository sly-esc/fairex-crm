'use server';

import { createClient } from '@/lib/supabase/server';
import { CompanyIntegration } from '@/types/superadmin';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function listIntegrations(company_id: string): Promise<ActionResponse<CompanyIntegration[]>> {
  const supabase = await createClient();
  
  // No traemos las credentials por seguridad, solo metadata
  const { data, error } = await supabase
    .from('company_integrations')
    .select('id, company_id, provider, integration_key, provider_account_id, display_name, connection_type, is_active, status, config, last_sync_at, last_error, sync_frequency, created_at, updated_at')
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as CompanyIntegration[] };
}

export async function saveIntegration(
  company_id: string, 
  provider: CompanyIntegration['provider'], 
  integration_key: string,
  provider_account_id: string,
  credentials: Record<string, any>, 
  config: Record<string, any> = {},
  display_name: string = ''
): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // Usamos upsert basado en company_id, provider y provider_account_id
  const { error } = await supabase
    .from('company_integrations')
    .upsert({
      company_id,
      provider,
      integration_key,
      provider_account_id,
      display_name,
      credentials,
      config,
      is_active: true,
      status: 'connected',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id, provider, provider_account_id'
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${company_id}`);
  
  return { success: true, data: undefined };
}

export async function deleteIntegration(id: string, company_id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('company_integrations')
    .delete()
    .eq('id', id)
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${company_id}`);
  
  return { success: true, data: undefined };
}
