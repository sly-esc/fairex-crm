'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertSource = 'system' | 'n8n' | 'manual' | 'webhook';

export interface Alert {
  id: string;
  company_id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  source: AlertSource;
  severity: AlertSeverity;
  lead_id: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  expires_at: string | null;
  created_at: string;
}

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

// -------------------------------------------------------------------------------------
// GET: Listar alertas de la empresa (excluye las expiradas)
// -------------------------------------------------------------------------------------
export async function getAlerts(filters?: {
  is_read?: boolean;
  severity?: AlertSeverity;
}): Promise<ActionResponse<Alert[]>> {
  const supabase = await createClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false });

  if (filters?.is_read !== undefined) {
    query = query.eq('is_read', filters.is_read);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data as Alert[]) ?? [] };
}

// -------------------------------------------------------------------------------------
// GET: Contar alertas no leídas (para el badge en el header)
// -------------------------------------------------------------------------------------
export async function getUnreadAlertsCount(): Promise<ActionResponse<number>> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) return { success: false, error: error.message };
  return { success: true, data: count ?? 0 };
}

// -------------------------------------------------------------------------------------
// UPDATE: Marcar una alerta como leída
// -------------------------------------------------------------------------------------
export async function markAlertAsRead(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/notifications');
  return { success: true };
}

// -------------------------------------------------------------------------------------
// UPDATE: Marcar todas las alertas como leídas
// -------------------------------------------------------------------------------------
export async function markAllAlertsAsRead(): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('is_read', false);

  if (error) return { success: false, error: error.message };
  revalidatePath('/notifications');
  return { success: true };
}
