'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/superadmin';

export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export type ResendAdminAccessResult =
  | { success: true }
  | {
      success: false
      code:
        | 'not_available'
        | 'already_active'
        | 'rate_limited'
        | 'dispatch_failed'
    }

function buildSecureOrigin() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  return 'https://fairexcrm.online'
}

export async function inviteAdminUser(company_id: string, email: string): Promise<ActionResponse<any>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const { supabase } = auth;



  // 2. Invitar al usuario usando Service Role
  const adminAuthClient = createAdminClient();
  
  // Enviamos la invitación. Supabase permite pasar datos en el User Metadata
  // Pasamos el company_id para que el trigger lo capture o simplemente lo podemos guardar
  // Sin embargo, si dependemos de que el trigger lo capture del metadata, debemos enviarlo.
  // Pero lo más seguro es usar el Admin API para invitar, e inmediatamente insertarlo en members.
  // Wait, el trigger en migration_phase_5_bloque2b_trigger.sql ¿maneja company_id? 
  // Let's just invite them and then manually set the company_id in their profile later,
  // or rely on the user passing metadata.
  
  const { data, error } = await adminAuthClient.auth.admin.inviteUserByEmail(email, {
    data: {
      company_id: company_id,
      role: 'admin' // role for company_members
    }
  });

  if (error) {
    console.error('Error inviting user:', error);
    return { success: false, error: error.message };
  }

  // Avanzar al siguiente paso del onboarding
  await supabase
    .from('companies')
    .update({ onboarding_status: 'modules_setup' })
    .eq('id', company_id);

  return { success: true, data: data.user };
}

export async function resendAdminAccess(companyId: number): Promise<ResendAdminAccessResult> {
  const auth = await requireSuperAdmin()
  if (!auth.success) return { success: false, code: 'not_available' }

  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    return { success: false, code: 'not_available' }
  }

  const adminClient = createAdminClient()

  const { data: profiles, error: profileError } = await adminClient
    .from('profiles')
    .select('auth_user_id')
    .eq('company_id', companyId)
    .eq('role', 'admin')

  if (profileError || !profiles || profiles.length !== 1 || !profiles[0].auth_user_id) {
    return { success: false, code: 'not_available' }
  }

  const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
    profiles[0].auth_user_id
  )

  if (userError || !userData?.user || !userData.user.email) {
    return { success: false, code: 'not_available' }
  }

  const confirmedAt = userData.user.email_confirmed_at ?? userData.user.confirmed_at ?? null;
  if (confirmedAt !== null) {
    return { success: false, code: 'already_active' }
  }

  const rawMetadataCompanyId = userData.user.user_metadata?.company_id

  let metadataCompanyId: number | null = null

  if (
    typeof rawMetadataCompanyId === 'number' &&
    Number.isSafeInteger(rawMetadataCompanyId) &&
    rawMetadataCompanyId > 0
  ) {
    metadataCompanyId = rawMetadataCompanyId
  } else if (
    typeof rawMetadataCompanyId === 'string' &&
    /^[1-9]\d*$/.test(rawMetadataCompanyId)
  ) {
    const parsed = Number(rawMetadataCompanyId)
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      metadataCompanyId = parsed
    }
  }

  if (metadataCompanyId !== companyId) {
    return { success: false, code: 'not_available' }
  }

  const { createPasswordlessDispatchClient } = await import('@/lib/supabase/passwordless-dispatch')
  const dispatchClient = createPasswordlessDispatchClient()

  const appOrigin = buildSecureOrigin()

  const { error: otpError } = await dispatchClient.auth.signInWithOtp({
    email: userData.user.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: new URL('/auth/confirm', appOrigin).toString(),
    },
  })

  if (otpError) {
    // Only detect rate_limit if status code is known (HTTP 429) - AuthError often exposes status
    if (otpError.status === 429) {
      return { success: false, code: 'rate_limited' }
    }
    return { success: false, code: 'dispatch_failed' }
  }

  return { success: true }
}
