'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/superadmin';
import { AiConfig } from '@/types/superadmin';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function getAiConfig(company_id: string): Promise<ActionResponse<AiConfig>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('company_settings')
    .select('ai_identity, ai_business_rules, ai_commercial_style, ai_constraints, ai_knowledge_sources')
    .eq('company_id', company_id)
    .maybeSingle();

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as AiConfig };
}

export async function saveAiConfig(company_id: string, config: AiConfig): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('company_settings')
    .upsert({
      company_id,
      ai_identity: config.ai_identity,
      ai_business_rules: config.ai_business_rules,
      ai_commercial_style: config.ai_commercial_style,
      ai_constraints: config.ai_constraints,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id'
    });

  if (error) {
    console.error(`Error saving AI config for company ${company_id}:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/superadmin/companies/${company_id}`);
  
  return { success: true, data: undefined };
}
