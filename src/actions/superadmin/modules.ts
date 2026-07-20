'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/superadmin';
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
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('company_modules')
    .select('*')
    .eq('company_id', company_id);

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as CompanyModule[] };
}

export async function toggleModule(company_id: string, module_key: string, is_active: boolean): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();

  if (!AVAILABLE_MODULES.includes(module_key)) {
    return { success: false, error: 'Módulo no válido' };
  }

  // Verificar si existe para evitar depender del constraint de upsert
  const { data: existing } = await adminClient
    .from('company_modules')
    .select('id')
    .eq('company_id', company_id)
    .eq('module_key', module_key)
    .maybeSingle();

  let error;
  if (existing) {
    const res = await adminClient.from('company_modules').update({
      is_active,
      activated_at: is_active ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id);
    error = res.error;
  } else {
    const res = await adminClient.from('company_modules').insert({
      company_id,
      module_key,
      is_active,
      config: {},
      plan_required: 'starter',
      activated_at: is_active ? new Date().toISOString() : null,
    });
    error = res.error;
  }

  if (error) {
    console.error(`Error toggling module ${module_key}:`, error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/superadmin/companies/${company_id}`);
  return { success: true, data: undefined };
}

export async function saveAllCompanyModules(company_id: string, selectedModules: Record<string, boolean>): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();

  // Get existing modules to know if we should insert or update
  const { data: existing } = await adminClient
    .from('company_modules')
    .select('module_key')
    .eq('company_id', company_id);
    
  const existingKeys = new Set(existing?.map(e => e.module_key) || []);
  const toInsert = [];
  
  for (const module_key of AVAILABLE_MODULES) {
    const is_active = !!selectedModules[module_key];
    
    if (existingKeys.has(module_key)) {
       await adminClient.from('company_modules')
         .update({ 
           is_active, 
           activated_at: is_active ? new Date().toISOString() : null,
           updated_at: new Date().toISOString()
         })
         .eq('company_id', company_id)
         .eq('module_key', module_key);
    } else {
       toInsert.push({
         company_id,
         module_key,
         is_active,
         config: {},
         plan_required: 'starter',
         activated_at: is_active ? new Date().toISOString() : null,
       });
    }
  }

  if (toInsert.length > 0) {
    const { error } = await adminClient.from('company_modules').insert(toInsert);
    if (error) {
       console.error("Error inserting modules", error);
       return { success: false, error: error.message };
    }
  }

  revalidatePath(`/superadmin/companies/${company_id}`);
  return { success: true };
}
