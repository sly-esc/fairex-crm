'use server';

import { createClient } from '@/lib/supabase/server';
import { CompanyModule } from '@/types/superadmin';
import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

const AVAILABLE_MODULES = [
  'crm', 
  'pipeline', 
  'inventario', 
  'rack', 
  'whatsapp_bot', 
  'facebook', 
  'instagram', 
  'tiktok', 
  'shopify', 
  'omnichannel', 
  'cotizaciones', 
  'analytics', 
  'knowledge_base', 
  'calendar', 
  'tasks', 
  'notifications', 
  'retargeting', 
  'followups', 
  'voice_ai', 
  'api_access'
];

export async function getCompanyModules(company_id: string): Promise<ActionResponse<CompanyModule[]>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('company_modules')
    .select('*')
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as CompanyModule[] };
}

export async function toggleModule(company_id: string, module_key: string, is_active: boolean): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  if (!AVAILABLE_MODULES.includes(module_key)) {
    return { success: false, error: 'Módulo no válido' };
  }

  // Usamos upsert por si el módulo no estaba registrado aún para esta empresa
  const { error } = await supabase
    .from('company_modules')
    .upsert({
      company_id,
      module_key,
      is_active,
      activated_at: is_active ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id, module_key'
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${company_id}`);
  
  return { success: true, data: undefined };
}
