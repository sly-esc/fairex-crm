'use server';

import { createClient } from '@/lib/supabase/server';
import { AiConfig } from '@/types/superadmin';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function getAiConfig(company_id: string): Promise<ActionResponse<AiConfig>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('company_settings')
    .select('ai_identity, ai_business_rules, ai_commercial_style, ai_constraints, ai_knowledge_sources')
    .eq('company_id', company_id)
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as AiConfig };
}

export async function saveAiConfig(company_id: string, config: AiConfig): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('company_settings')
    .update({
      ai_identity: config.ai_identity,
      ai_business_rules: config.ai_business_rules,
      ai_commercial_style: config.ai_commercial_style,
      ai_constraints: config.ai_constraints,
      updated_at: new Date().toISOString()
    })
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${company_id}`);
  
  // Si estamos en onboarding, avanzar el paso (opcional, lo puede manejar el cliente)
  
  return { success: true, data: undefined };
}
