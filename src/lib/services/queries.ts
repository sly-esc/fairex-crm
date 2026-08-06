'use server'

import { createClient } from '../supabase/server'

// --- Helpers ---

class AuthError extends Error {
  constructor(message: 'NO_SESSION' | 'PROFILE_NOT_FOUND' | 'INVALID_COMPANY_ID' | 'PROFILE_QUERY_FAILED') {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Normalizes stage names. Converts legacy values like "contacto_inicial"
 * to "Nuevo" without touching the database.
 */
function normalizeStage(raw: string): string {
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'contacto_inicial' || normalized === 'nuevo') return 'Nuevo'
  // Capitalize first letter for everything else
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/**
 * Retrieves the current user's company_id from the profiles table securely.
 * Throws an AuthError if validation fails.
 */
async function requireUserCompanyId(supabase: any): Promise<number> {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.warn('[AUTH] Ausencia de sesión')
    throw new AuthError('NO_SESSION')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single()

  if (error) {
    console.error('[AUTH] Error al consultar perfil:', error.message)
    throw new AuthError('PROFILE_QUERY_FAILED')
  }

  if (!data) {
    console.warn('[AUTH] Perfil no encontrado')
    throw new AuthError('PROFILE_NOT_FOUND')
  }

  const companyId = Number(data.company_id)
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    console.error('[AUTH] company_id inválido:', data.company_id)
    throw new AuthError('INVALID_COMPANY_ID')
  }

  return companyId
}

// --- Server Actions ---

export async function getLeadMemoryTest() {
  const supabase = await createClient()
  const companyId = await requireUserCompanyId(supabase)

  // Consulta de solo lectura para obtener datos de lead_memory
  const { data, error } = await supabase
    .from('lead_memory')
    .select('*')
    .eq('company_id', companyId)
    .limit(10) // Limitamos a 10 para la prueba

  if (error) {
    console.error('Error en Supabase al leer lead_memory:', error)
    throw new Error(error.message)
  }

  return data
}

export async function updateLeadEstado(id: string, estado: 'ACTIVO' | 'EXCLUIR') {
  const supabase = await createClient()
  const companyId = await requireUserCompanyId(supabase)

  const { data, error } = await supabase
    .from('lead_memory')
    .update({ estado })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) {
    console.error('Error al actualizar estado del lead:', error)
    throw new Error(error.message)
  }

  return data
}

export async function getLeadsData() {
  const supabase = await createClient()
  const companyId = await requireUserCompanyId(supabase)

  const { data, error } = await supabase
    .from('lead_memory')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    throw new Error(error.message)
  }

  const leads = []
  const conversations = []

  for (const row of data || []) {
    const id = row.id.toString()
    const name = row.numero || 'Sin numero'
    const stage = normalizeStage(row.etapa_venta || 'nuevo')

    let status: 'hot' | 'warm' | 'cold' = 'warm'
    if (row.prioridad === 'alta') status = 'hot'
    else if (row.prioridad === 'baja') status = 'cold'

    const dateObj = row.ultimo_contacto ? new Date(row.ultimo_contacto) : new Date()
    const timeStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

    leads.push({
      id,
      name,
      company: 'Desconocida',
      score: row.score_lead || 0,
      source: 'WhatsApp Inbound',
      value: '0',
      assignee: row.assigned_user_id || 'IA',
      stage,
      estado: row.estado || 'ACTIVO'
    })

    conversations.push({
      id,
      name,
      lastMessage: row.resumen_inteligente || row.ultima_accion || '',
      time: timeStr,
      unread: 0,
      status,
      avatar: 'WA',
      estado: row.estado || 'ACTIVO'
    })
  }

  return { leads, conversations }
}

/**
 * Fetches the real chat history for a lead from n8n_chat_histories.
 * Joins via `session_id` = lead `numero`.
 */
export async function getChatHistory(numero: string) {
  const supabase = await createClient()
  const companyId = await requireUserCompanyId(supabase)

  const { data, error } = await supabase
    .from('n8n_chat_histories')
    .select('*')
    .eq('session_id', numero)
    .eq('company_id', companyId)
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching chat history:', error)
    return []
  }

  return (data || []).map((row: any) => {
    const msgType: string = row.message?.type || 'human'
    let text = ''

    if (msgType === 'ai') {
      // AI messages from n8n may store a JSON string inside content
      try {
        const parsed = JSON.parse(row.message.content)
        text = parsed.respuesta || parsed.content || row.message.content
      } catch {
        text = row.message.content || ''
      }
    } else {
      text = row.message?.content || ''
    }

    return {
      id: `msg-${row.id}`,
      senderId: msgType === 'human' ? 'lead' : 'ai',
      text,
      time: '',
      status: 'read' as const
    }
  }).filter((m: any) => m.text.trim() !== '')
}

/**
 * Fetches a single lead's memory data for the right panel in Conversaciones.
 * Uses the lead's numeric DB id (from lead_memory).
 */
export async function getLeadMemory(id: string) {
  const supabase = await createClient()
  const companyId = await requireUserCompanyId(supabase)

  const { data, error } = await supabase
    .from('lead_memory')
    .select('score_lead, prioridad, resumen_inteligente, necesidades, objeciones, etapa_venta, numero')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !data) return null

  // Parse needs and objections — may be a plain string or comma-separated
  const parseList = (val: string | null): string[] => {
    if (!val || val.trim() === '') return []
    try { return JSON.parse(val) } catch { /* not JSON */ }
    return val.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean)
  }

  return {
    score: data.score_lead || 0,
    stage: normalizeStage(data.etapa_venta || 'nuevo'),
    summary: data.resumen_inteligente || '—',
    needs: parseList(data.necesidades),
    objections: parseList(data.objeciones),
    numero: data.numero
  }
}
