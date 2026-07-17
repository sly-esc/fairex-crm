'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'followup' | 'call' | 'meeting' | 'email' | 'manual' | 'system';

export interface Task {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  notes: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  lead_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  notes?: string;
  type?: TaskType;
  priority?: TaskPriority;
  lead_id?: string;
  assigned_to?: string;
  due_date?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  notes?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string;
  due_date?: string;
}

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

// -------------------------------------------------------------------------------------
// GET: Listar tareas de la empresa actual
// -------------------------------------------------------------------------------------
export async function getTasks(filters?: {
  status?: TaskStatus;
  lead_id?: string;
  assigned_to?: string;
}): Promise<ActionResponse<Task[]>> {
  const supabase = await createClient();

  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data as Task[]) ?? [] };
}

// -------------------------------------------------------------------------------------
// CREATE: Crear una nueva tarea
// -------------------------------------------------------------------------------------
export async function createTask(input: CreateTaskInput): Promise<ActionResponse<Task>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado' };

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      notes: input.notes ?? null,
      type: input.type ?? 'manual',
      priority: input.priority ?? 'medium',
      status: 'pending',
      lead_id: input.lead_id ?? null,
      assigned_to: input.assigned_to ?? null,
      created_by: user.id,
      due_date: input.due_date ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/tasks');
  return { success: true, data: data as Task };
}

// -------------------------------------------------------------------------------------
// UPDATE: Actualizar campos de una tarea
// -------------------------------------------------------------------------------------
export async function updateTask(id: string, input: UpdateTaskInput): Promise<ActionResponse<Task>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/tasks');
  return { success: true, data: data as Task };
}

// -------------------------------------------------------------------------------------
// COMPLETE: Marcar tarea como completada
// -------------------------------------------------------------------------------------
export async function completeTask(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/tasks');
  return { success: true };
}

// -------------------------------------------------------------------------------------
// DELETE: Eliminación suave (soft delete via status='cancelled')
// -------------------------------------------------------------------------------------
export async function cancelTask(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/tasks');
  return { success: true };
}
