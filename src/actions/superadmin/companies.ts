'use server';

import { requireSuperAdmin } from '@/lib/superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isEncryptedCredentialsEnvelope } from '@/lib/integrations/encryption.server';
import { Company, OnboardingData, PlanType } from '@/types/superadmin';
import { revalidatePath } from 'next/cache';

// Helper for generic response
export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function createCompany(data: OnboardingData): Promise<ActionResponse<Company>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  
  const adminClient = createAdminClient();

  const { data: newCompany, error: companyError } = await adminClient
    .from('companies')
    .insert({
      nombre: data.companyName,
      slug: data.slug,
      industry: data.industry,
      plan: data.plan,
      estado: 'activa',
      onboarding_status: 'in_progress',
    })
    .select()
    .single();

  if (companyError) {
    console.error('Error creating company:', companyError);
    return { success: false, error: companyError.message };
  }

  // Crear la configuración inicial
  const { error: settingsError } = await adminClient
    .from('company_settings')
    .insert({
      company_id: newCompany.id
    });

  if (settingsError) {
    console.error(`Error creating company_settings for company ${newCompany.id}:`, settingsError);
    return { success: false, error: 'Error al inicializar la configuración de la empresa' };
  }

  revalidatePath('/superadmin/companies');

  const mappedCompany: Company = {
    ...newCompany,
    name: newCompany.nombre,
    is_active: newCompany.estado === 'activa',
  };

  return { success: true, data: mappedCompany };
}

export async function listAllCompanies(): Promise<ActionResponse<Company[]>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  const mappedData: Company[] = data.map((c: any) => ({
    ...c,
    name: c.nombre,
    is_active: c.estado === 'activa',
  }));

  return { success: true, data: mappedData };
}

export async function updateCompanyStatus(id: string, is_active: boolean): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('companies')
    .update({ estado: is_active ? 'activa' : 'inactiva' })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/superadmin/companies');
  revalidatePath(`/superadmin/companies/${id}`);

  return { success: true, data: undefined };
}

type UpdateCompanyInput = {
  companyName: string;
  slug: string;
  industry: string;
  plan: PlanType;
};

export async function updateCompany(companyId: string | number, data: UpdateCompanyInput): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  const parsedId = Number(companyId);
  if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
    return { success: false, error: 'ID de empresa inválido' };
  }

  const cleanName = data.companyName?.trim();
  const cleanSlug = data.slug?.trim().toLowerCase();
  const cleanIndustry = data.industry?.trim();

  if (!cleanName || !cleanSlug || !/^[a-z0-9-]+$/.test(cleanSlug)) {
    return { success: false, error: 'Datos de empresa inválidos' };
  }

  if (!['starter', 'pro', 'enterprise'].includes(data.plan)) {
    return { success: false, error: 'Plan inválido' };
  }

  const adminClient = createAdminClient();
  const { data: updatedCompany, error } = await adminClient
    .from('companies')
    .update({
      nombre: cleanName,
      slug: cleanSlug,
      industry: cleanIndustry,
      plan: data.plan,
    })
    .eq('id', parsedId)
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'El slug especificado ya está en uso por otra empresa' };
    }
    return { success: false, error: 'No se pudo actualizar la empresa' };
  }

  if (!updatedCompany) {
    return { success: false, error: 'Empresa no encontrada' };
  }

  revalidatePath('/superadmin/companies');
  revalidatePath(`/superadmin/companies/${parsedId}`);
  return { success: true, data: undefined };
}

export async function getCompanyDetail(id: string): Promise<ActionResponse<any>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  
  const adminClient = createAdminClient();
  
  // 1. Buscar empresa
  const { data: company, error } = await adminClient
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`[getCompanyDetail] Error fetching company id=${id}:`, JSON.stringify(error));
    return { success: false, error: error.message };
  }

  // 2. Buscar settings
  const { data: settingsData } = await adminClient
    .from('company_settings')
    .select('*')
    .eq('company_id', id);

  // 3. Buscar módulos
  const { data: modulesData } = await adminClient
    .from('company_modules')
    .select('*')
    .eq('company_id', id);

  // 4. Buscar integraciones (sin enviar credentials crudos al cliente)
  const { data: integrationsData } = await adminClient
    .from('company_integrations')
    .select('id, company_id, provider, integration_key, provider_account_id, display_name, connection_type, is_active, status, config, last_sync_at, last_error, sync_frequency, created_at, updated_at, credentials')
    .eq('company_id', id);

  const safeIntegrations = (integrationsData || []).map((int: any) => {
    const { credentials, ...rest } = int;
    return {
      ...rest,
      has_credentials: isEncryptedCredentialsEnvelope(credentials)
    };
  });

  let adminAccessStatus: 'pending' | 'active' | 'missing' | 'ambiguous' = 'ambiguous';
  try {
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('auth_user_id')
      .eq('company_id', id)
      .eq('role', 'admin');

    if (profileError) {
      adminAccessStatus = 'ambiguous';
    } else if (!profiles || profiles.length === 0) {
      adminAccessStatus = 'missing';
    } else if (profiles.length > 1) {
      adminAccessStatus = 'ambiguous';
    } else {
      const authUserId = profiles[0].auth_user_id;
      if (!authUserId) {
        adminAccessStatus = 'missing';
      } else {
        const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(authUserId);
        if (userError || !userData?.user) {
          adminAccessStatus = 'ambiguous';
        } else {
          const confirmedAt = userData.user.email_confirmed_at ?? userData.user.confirmed_at ?? null;
          if (confirmedAt === null) {
            adminAccessStatus = 'pending';
          } else {
            adminAccessStatus = 'active';
          }
        }
      }
    }
  } catch (e) {
    adminAccessStatus = 'ambiguous';
  }

  const mappedData = {
    ...company,
    company_settings: settingsData || [],
    company_modules: modulesData || [],
    company_integrations: safeIntegrations,
    name: company.nombre ?? company.name ?? '(Sin nombre)',
    is_active: company.estado === 'activa',
    phone: company.telefono ?? null,
    adminAccessStatus,
  };

  return { success: true, data: mappedData };
}

export async function updateOnboardingStatus(id: string, status: string): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  
  const validStatuses = ['pending', 'in_progress', 'completed', 'suspended'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: 'Estado de onboarding no válido' };
  }
  
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
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

export async function skipCSVAndFinishOnboarding(companyId: number): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };

  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    return { success: false, error: 'companyId inválido' };
  }

  const adminClient = createAdminClient();

  const { data: company, error: checkError } = await adminClient
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .single();

  if (checkError || !company) {
    return { success: false, error: 'La empresa especificada no existe' };
  }

  const { error } = await adminClient
    .from('companies')
    .update({ 
      onboarding_status: 'completed',
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('id', companyId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${companyId}`);
  return { success: true, data: undefined };
}
