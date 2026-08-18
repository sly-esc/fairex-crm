// ======================================================================================
// TIPOS: Endpoint /api/n8n/context
// ======================================================================================
// Responsabilidad: Definir la forma exacta del payload de entrada y del Runtime Object
// que se devuelve a n8n. Ninguna lógica de negocio vive aquí.
//
// REGLA: Este archivo es la fuente de verdad del contrato entre Next.js y n8n.
// Cualquier campo nuevo que n8n necesite debe añadirse aquí primero.
// ======================================================================================

// -------------------------------------------------------------------------------------
// ENTRADA: Payload que n8n envía al endpoint
// -------------------------------------------------------------------------------------

/**
 * Proveedores de canal soportados. Agnóstico del protocolo (webhook, oauth, api_key).
 * Añadir nuevos proveedores aquí no requiere cambios en la arquitectura del endpoint.
 */
export type ChannelProvider =
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'shopify'
  | 'webchat'
  | 'email'
  | 'sms'
  | 'api'
  | 'voice'
  | string; // Permite extensión sin cambios de tipo

/**
 * Payload que n8n envía en el primer nodo HTTP de cualquier workflow.
 * El campo `identifier` es el account ID del canal que recibió el mensaje
 * (ej: WhatsApp Phone Number ID, Facebook Page ID, etc.)
 */
export interface N8NContextRequest {
  provider: ChannelProvider;
  identifier: string; // ID único de la cuenta del proveedor (provider_account_id en DB)
  // Metadatos opcionales del mensaje entrante (no son requeridos para resolver contexto)
  metadata?: {
    sender_id?: string;    // ID del usuario que envió el mensaje
    message_id?: string;   // ID único del mensaje
    timestamp?: string;    // ISO 8601
    raw?: Record<string, unknown>; // Payload crudo del proveedor (para debugging)
  };
}

// -------------------------------------------------------------------------------------
// RESPUESTA: Runtime Object completo que n8n recibirá
// -------------------------------------------------------------------------------------

/**
 * Bloque de contexto de la empresa.
 * Identifica de forma unívoca el tenant y su estado actual.
 */
export interface RuntimeContext {
  company_id: string;
  company_name: string;
  company_slug: string | null;
  plan: 'starter' | 'pro' | 'enterprise';
  is_active: boolean;
  industry: string | null;
  /** Identificador de la integración específica que disparó la solicitud */
  integration_id: string;
  integration_display_name: string | null;
  channel_provider: ChannelProvider;
}

/**
 * Bloque de sesión. Describe el canal y la cuenta específica que recibió el evento.
 * Permite a n8n saber por qué canal responder.
 */
export interface RuntimeSession {
  provider: ChannelProvider;
  provider_account_id: string;
  connection_type: 'oauth' | 'api_key' | 'webhook' | 'manual';
  /**
   * Configuración pública de la integración (sin credenciales).
   * Puede incluir: phone_number_id, waba_id, page_id, etc.
   */
  config: Record<string, unknown>;
}

/**
 * Bloque de cliente. Vacío en este endpoint (es responsabilidad de n8n
 * cargar el lead desde lead_memory). Incluido para compatibilidad futura.
 */
export interface RuntimeCustomer {
  sender_id: string | null;
  // n8n resolverá el lead completo desde lead_memory usando company_id + sender_id
}

/**
 * Bloque de IA. Contiene todas las directrices que configuran el comportamiento
 * del agente para esta empresa específica.
 */
export interface RuntimeAI {
  identity: string | null;          // Quién es el bot (nombre, personalidad)
  business_rules: string | null;    // Reglas de negocio que el bot debe seguir
  commercial_style: string | null;  // Cómo debe vender / comunicarse
  constraints: string | null;       // Qué no puede hacer el bot nunca
  knowledge_sources: unknown[];     // URLs, documentos o vectorstores disponibles
}

/**
 * Bloque de módulos activos. Permite a n8n saber qué capacidades están habilitadas
 * para esta empresa (ej: si puede hacer cotizaciones, si tiene acceso a inventario, etc.)
 */
export interface RuntimeModules {
  active: string[];                         // Lista de module_key activos
  config: Record<string, Record<string, unknown>>; // Configuración por módulo
}

/**
 * Bloque de métricas. Vacío en V1, reservado para futuros Rate Limits,
 * quotas de mensajes, o datos de facturación que n8n pudiera necesitar consultar.
 */
export interface RuntimeMetrics {
  messages_today?: number;
  quota_limit?: number;
  quota_remaining?: number;
}

// -------------------------------------------------------------------------------------
// BLOQUE DE NEGOCIO: Datos del perfil empresarial editables por el cliente
// -------------------------------------------------------------------------------------

/**
 * Horario de atención por día de la semana.
 * Los valores open/close están en formato HH:MM (24h).
 */
export interface BusinessHoursEntry {
  day: string;      // e.g. 'Lunes', 'Martes'
  open: string;     // e.g. '09:00'
  close: string;    // e.g. '18:00'
  is_open: boolean;
}

/**
 * Pregunta frecuente del negocio.
 */
export interface BusinessFAQ {
  question: string;
  answer: string;
}

/**
 * Perfil del negocio editable por el cliente desde su dashboard.
 * Alimenta el contexto del agente IA en cada conversación.
 * NUNCA contiene precios de servicios ni credenciales.
 */
export interface RuntimeBusiness {
  business_name: string | null;
  description: string | null;
  address: string | null;
  service_areas: string[];
  business_hours: BusinessHoursEntry[];
  phones: string[];
  emails: string[];
  website: string | null;
  payment_methods: string[];
  purchase_process: string | null;
  policies: string | null;
  faqs: BusinessFAQ[];
  human_handoff: string | null;
  additional_information: string | null;
}

// -------------------------------------------------------------------------------------
// BLOQUE DE SERVICIOS: Catálogo activo de la empresa
// -------------------------------------------------------------------------------------

/**
 * Servicio individual del catálogo de la empresa.
 * metadata puede contener información comercial adicional estructurada
 * (ej: mantenimiento mensual, presupuesto inicial, etc.).
 */
export interface RuntimeService {
  id: string;                                        // UUID
  name: string;
  description: string | null;
  price: number | null;                              // null si no aplica o es por cotizar
  currency: string;                                  // ISO 4217 tal como está en DB; no se infiere
  price_type: 'fixed' | 'from' | 'quote' | 'free';
  category: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;                 // Preservar íntegro desde la DB
}

/**
 * Bloque de servicios activos de la empresa.
 */
export interface RuntimeServices {
  items: RuntimeService[];
}

/**
 * Objeto Runtime completo. Este es el contrato entre Next.js y n8n.
 * n8n debe tratar este objeto como inmutable durante la ejecución del workflow.
 */
export interface N8NRuntimeObject {
  /** Contexto del tenant */
  context: RuntimeContext;
  /** Canal que recibió el mensaje */
  session: RuntimeSession;
  /** Datos básicos del remitente (n8n los enriquece con lead_memory) */
  customer: RuntimeCustomer;
  /** Configuración de IA cargada desde company_settings */
  ai: RuntimeAI;
  /** Perfil de negocio editable por el cliente (desde company_settings.business_profile) */
  business: RuntimeBusiness;
  /** Catálogo de servicios activos de la empresa (desde company_services) */
  services: RuntimeServices;
  /** Módulos activos y su configuración */
  modules: RuntimeModules;
  /** Métricas y cuotas (V1: vacío) */
  metrics: RuntimeMetrics;
  /** Versión del Runtime Object. Permite deprecar campos gradualmente. */
  version: '1.0';
  /** Timestamp de resolución en UTC ISO 8601 */
  resolved_at: string;
}

// -------------------------------------------------------------------------------------
// RESPUESTAS DEL ENDPOINT
// -------------------------------------------------------------------------------------

export type N8NContextSuccess = {
  ok: true;
  runtime: N8NRuntimeObject;
};

export type N8NContextError = {
  ok: false;
  error: string;
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'COMPANY_INACTIVE' | 'INTERNAL_ERROR';
};

export type N8NContextResponse = N8NContextSuccess | N8NContextError;
