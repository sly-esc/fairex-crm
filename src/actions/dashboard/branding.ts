'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireUserCompanyId } from '@/lib/services/queries';
import { revalidatePath } from 'next/cache';

export async function updateBrandingSettings(logoUrl: string) {
  // First, verify authentication and get the user's company ID
  // We use the regular client for this to ensure the user is actually authenticated
  const supabase = await createClient();
  let companyId: number;
  
  try {
    companyId = await requireUserCompanyId(supabase);
  } catch (error) {
    return { success: false, error: 'No autorizado' };
  }

  // Use the admin client to bypass RLS since users don't have UPDATE rights on companies table
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('companies')
    .update({ logo_url: logoUrl })
    .eq('id', companyId);

  if (error) {
    console.error('Error updating branding:', error);
    return { success: false, error: 'No se pudo guardar la configuración de branding' };
  }

  revalidatePath('/settings');
  revalidatePath('/', 'layout'); // Revalidate everything to reflect the logo change in the Sidebar

  return { success: true };
}
