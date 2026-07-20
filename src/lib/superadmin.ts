import { createClient } from '@/lib/supabase/server';
import { SupabaseClient, User } from '@supabase/supabase-js';

export type SuperAdminAuthResponse = 
  | { success: false; error: string }
  | { success: true; supabase: SupabaseClient; user: User; profile: any };

export async function requireSuperAdmin(): Promise<SuperAdminAuthResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'No autorizado' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return { success: false, error: 'No tienes permisos de Super Admin' };
  }

  return { success: true, supabase, user, profile };
}
