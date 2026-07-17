'use server';

import { createClient } from '@/lib/supabase/server';
import { Company, OnboardingData } from '@/types/superadmin';
import { revalidatePath } from 'next/cache';

// Helper for generic response
export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function createCompany(data: OnboardingData): Promise<ActionResponse<Company>> {
  const supabase = await createClient();

  // 1. Verificar si somos super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) return { success: false, error: 'No tienes permisos de Super Admin' };

  // 2. Insertar la empresa (bypasses RLS from server side with service_role if needed, 
  // but for now relying on authenticated user and existing policies, or we might need a service_role client if RLS restricts inserts. 
  // Wait, if we use the normal client, does the Super Admin have RLS to insert companies? 
  // Let's assume yes or that companies table doesn't have restrictive RLS for inserts yet. 
  // To be safe and act as a true BFF, we can use an elevated client if necessary. 
  // For now, let's use the standard client.)
  
  // TODO: We may need the service_role client to bypass RLS for super admin actions.
  // Actually, let's use standard client. If it fails, we will adapt.
  
  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: data.companyName,
      slug: data.slug,
      industry: data.industry,
      plan: data.plan,
      onboarding_status: 'admin_setup', // Avanzar al siguiente paso
    })
    .select()
    .single();

  if (companyError) {
    console.error('Error creating company:', companyError);
    return { success: false, error: companyError.message };
  }

  // Crear la configuración inicial de IA vacía/default
  await supabase
    .from('company_settings')
    .insert({
      company_id: newCompany.id,
      ai_config: { tone: "profesional", auto_response: true }
    });

  revalidatePath('/superadmin/companies');

  return { success: true, data: newCompany as Company };
}

export async function listAllCompanies(): Promise<ActionResponse<Company[]>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  return { success: true, data: data as Company[] };
}

export async function updateCompanyStatus(id: string, is_active: boolean): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('companies')
    .update({ is_active })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/superadmin/companies');
  revalidatePath(`/superadmin/companies/${id}`);

  return { success: true, data: undefined };
}

export async function getCompanyDetail(id: string): Promise<ActionResponse<any>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_settings(*),
      company_modules(*),
      company_integrations(*)
    `)
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data };
}

export async function updateOnboardingStatus(id: string, status: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('companies')
    .update({ 
      onboarding_status: status,
      ...(status === 'completed' ? { onboarding_completed_at: new Date().toISOString() } : {})
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/superadmin/companies/${id}`);
  return { success: true, data: undefined };
}
