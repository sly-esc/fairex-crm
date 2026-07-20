'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/superadmin';

export type ActionResponse<T> = { success: boolean; data?: T; error?: string };

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
