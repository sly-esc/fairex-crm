// ======================================================================================
// ENDPOINT: POST /api/n8n/context
// ======================================================================================
// RESPONSABILIDAD: Endpoint 100% stateless. Solo lee Supabase para resolver y devolver
// el contexto completo que n8n necesita al inicio de cualquier workflow.
//
// REGLAS INAMOVIBLES:
// 1. NUNCA escribe en base de datos. Solo SELECT.
// 2. No contiene lógica de negocio del bot. Solo resuelve contexto.
// 3. Agnóstico del canal (WhatsApp, IG, FB, TikTok, WebChat, etc.)
// 4. Protegido por header X-N8N-Secret contra llamadas no autorizadas.
// 5. Usa Promise.all para queries paralelas tras resolver company_id.
// ======================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  N8NContextRequest,
  N8NContextResponse,
  N8NRuntimeObject,
  RuntimeModules,
  RuntimeBusiness,
  RuntimeService,
  BusinessHoursEntry,
  BusinessFAQ,
} from '@/types/n8n-context';

// -------------------------------------------------------------------------------------
// CONSTANTES
// -------------------------------------------------------------------------------------

const RUNTIME_VERSION = '1.0' as const;

// -------------------------------------------------------------------------------------
// SEGURIDAD: Validación del Secret compartido con n8n
// -------------------------------------------------------------------------------------

function validateSecret(req: NextRequest): boolean {
  const secret = process.env.N8N_CONTEXT_SECRET;
  if (!secret) {
    // Si no está configurado, bloqueamos en producción. En dev, permitimos.
    if (process.env.NODE_ENV === 'production') return false;
    console.warn('[n8n/context] ADVERTENCIA: N8N_CONTEXT_SECRET no configurado (modo desarrollo).');
    return true;
  }
  return req.headers.get('x-n8n-secret') === secret;
}

// -------------------------------------------------------------------------------------
// HANDLER PRINCIPAL
// -------------------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse<N8NContextResponse>> {
  // 1. Validación de seguridad — siempre primero
  if (!validateSecret(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // 2. Parse y validación del payload
  let body: N8NContextRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  const { provider, identifier, metadata } = body;

  if (!provider || !identifier) {
    return NextResponse.json(
      { ok: false, error: 'provider e identifier son requeridos', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  // Normalización estricta y condicionada del identifier
  let normalizedIdentifier = String(identifier).trim();
  if (provider === 'ycloud') {
    normalizedIdentifier = normalizedIdentifier.replace(/\D/g, '');
  }
  if (!normalizedIdentifier) {
    return NextResponse.json({ ok: false, error: 'Identifier inválido', code: 'INTERNAL_ERROR' }, { status: 400 });
  }

  // 3. Cliente Supabase con service_role (solo server-side, nunca llega al cliente)
  const supabase = createAdminClient();

  try {
    // ─────────────────────────────────────────────────────────────────────────────
    // PASO 1: Resolución del tenant
    // Buscamos en company_integrations la cuenta específica que recibió el mensaje.
    // El campo `provider_account_id` es el identificador único de esa cuenta
    // en el sistema del proveedor (ej: WhatsApp Phone Number ID, FB Page ID).
    // ─────────────────────────────────────────────────────────────────────────────
    const { data: integration, error: integrationError } = await supabase
      .from('company_integrations')
      .select(`
        id,
        company_id,
        provider,
        provider_account_id,
        display_name,
        connection_type,
        is_active,
        config
      `)
      .eq('provider', provider)
      .eq('provider_account_id', normalizedIdentifier)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se encontró integración activa para provider='${provider}' identifier='${identifier}'`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const { company_id } = integration;

    // ─────────────────────────────────────────────────────────────────────────────
    // PASO 2: Queries paralelas una vez conocemos el company_id
    // Usamos Promise.all para minimizar latencia total.
    // NUNCA hacemos escrituras aquí.
    // ─────────────────────────────────────────────────────────────────────────────
    const [companyResult, settingsResult, modulesResult, servicesResult] = await Promise.all([
      // 2a. Datos base de la empresa
      supabase
        .from('companies')
        .select('id, nombre, slug, plan, estado, industry')
        .eq('id', company_id)
        .single(),

      // 2b. Configuración de IA + perfil de negocio
      supabase
        .from('company_settings')
        .select('ai_identity, ai_business_rules, ai_commercial_style, ai_constraints, ai_knowledge_sources, business_profile')
        .eq('company_id', company_id)
        .maybeSingle(),

      // 2c. Módulos activos (feature flags)
      supabase
        .from('company_modules')
        .select('module_key, is_active, config')
        .eq('company_id', company_id)
        .eq('is_active', true),

      // 2d. Catálogo de servicios activos
      // IMPORTANTE: filtra exclusivamente por el company_id resuelto en PASO 1.
      // Nunca se usa un company_id proveniente del request.
      supabase
        .from('company_services')
        .select('id, name, description, price, currency, price_type, category, is_active, metadata')
        .eq('company_id', company_id)
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ]);

    // Verificar empresa
    if (companyResult.error || !companyResult.data) {
      return NextResponse.json(
        { ok: false, error: 'Empresa no encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const company = companyResult.data;

    // Verificar empresa activa
    if (company.estado !== 'activa') {
      return NextResponse.json(
        { ok: false, error: 'La empresa está inactiva', code: 'COMPANY_INACTIVE' },
        { status: 403 }
      );
    }

    const settings = settingsResult.data ?? null;
    const moduleRows = modulesResult.data ?? [];

    // Verificar que la query de servicios no haya fallado.
    // Un error real (permisos, tabla inexistente, etc.) se propaga como error del runtime.
    // Una lista vacía es válida y no es un error.
    if (servicesResult.error) {
      console.error('[n8n/context] Error al obtener company_services:', servicesResult.error.message);
      return NextResponse.json(
        { ok: false, error: 'Error al resolver servicios de la empresa', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
    const serviceRows = servicesResult.data ?? [];

    // ─────────────────────────────────────────────────────────────────────────────
    // PASO 3: Construcción del Runtime Object
    // Mapeamos la data de Supabase al contrato estricto de N8NRuntimeObject.
    // ─────────────────────────────────────────────────────────────────────────────

    // Construir índice de módulos activos
    const modulesConfig: RuntimeModules['config'] = {};
    for (const mod of moduleRows) {
      modulesConfig[mod.module_key] = mod.config as Record<string, unknown>;
    }

    // ---------------------------------------------------------------------------------
    // Normalizar business_profile con defaults seguros y validación profunda de arrays.
    // ---------------------------------------------------------------------------------
    const rawProfile = (settings?.business_profile ?? {}) as Record<string, unknown>;

    const normalizeStringArray = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

    const normalizeBusinessHours = (value: unknown): BusinessHoursEntry[] => {
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is BusinessHoursEntry =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).day === 'string' &&
        typeof (item as Record<string, unknown>).open === 'string' &&
        typeof (item as Record<string, unknown>).close === 'string' &&
        typeof (item as Record<string, unknown>).is_open === 'boolean'
      );
    };

    const normalizeFaqs = (value: unknown): BusinessFAQ[] => {
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is BusinessFAQ =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).question === 'string' &&
        typeof (item as Record<string, unknown>).answer === 'string'
      );
    };

    const business: RuntimeBusiness = {
      business_name:          typeof rawProfile.business_name === 'string'     ? rawProfile.business_name          : null,
      description:            typeof rawProfile.description === 'string'       ? rawProfile.description             : null,
      address:                typeof rawProfile.address === 'string'           ? rawProfile.address                 : null,
      service_areas:          normalizeStringArray(rawProfile.service_areas),
      business_hours:         normalizeBusinessHours(rawProfile.business_hours),
      phones:                 normalizeStringArray(rawProfile.phones),
      emails:                 normalizeStringArray(rawProfile.emails),
      website:                typeof rawProfile.website === 'string'          ? rawProfile.website                 : null,
      payment_methods:        normalizeStringArray(rawProfile.payment_methods),
      purchase_process:       typeof rawProfile.purchase_process === 'string' ? rawProfile.purchase_process        : null,
      policies:               typeof rawProfile.policies === 'string'         ? rawProfile.policies                : null,
      faqs:                   normalizeFaqs(rawProfile.faqs),
      human_handoff:          typeof rawProfile.human_handoff === 'string'    ? rawProfile.human_handoff           : null,
      additional_information: typeof rawProfile.additional_information === 'string' ? rawProfile.additional_information : null,
    };

    // ---------------------------------------------------------------------------------
    // Normalizar servicios.
    // price: number | null  (no se inventa precio si la DB tiene NULL).
    // metadata: preservado íntegro, incluyendo objetos de información comercial.
    // price_type: se conserva tal cual desde la DB, sin transformar.
    // ---------------------------------------------------------------------------------
    const serviceItems: RuntimeService[] = serviceRows.map((row) => ({
      id:          row.id as string,
      name:        row.name as string,
      description: typeof row.description === 'string' ? row.description : null,
      price:       row.price != null ? Number(row.price) : null,
      currency:    row.currency as string,
      price_type:  row.price_type as RuntimeService['price_type'],
      category:    typeof row.category === 'string' ? row.category : null,
      is_active:   Boolean(row.is_active),
      metadata:    (row.metadata ?? {}) as Record<string, unknown>,
    }));

    const runtime: N8NRuntimeObject = {
      context: {
        company_id: company.id,
        company_name: company.nombre,
        company_slug: company.slug ?? null,
        plan: company.plan,
        is_active: company.estado === 'activa',
        industry: company.industry ?? null,
        integration_id: integration.id,
        integration_display_name: integration.display_name ?? null,
        channel_provider: provider,
      },
      session: {
        provider,
        provider_account_id: integration.provider_account_id ?? identifier,
        connection_type: integration.connection_type as 'oauth' | 'api_key' | 'webhook' | 'manual',
        config: (integration.config as Record<string, unknown>) ?? {},
      },
      customer: {
        // n8n enriquecerá este bloque con lead_memory usando company_id + sender_id
        sender_id: metadata?.sender_id ?? null,
      },
      ai: {
        identity: settings?.ai_identity ?? null,
        business_rules: settings?.ai_business_rules ?? null,
        commercial_style: settings?.ai_commercial_style ?? null,
        constraints: settings?.ai_constraints ?? null,
        knowledge_sources: settings?.ai_knowledge_sources ?? [],
      },
      business,
      services: {
        items: serviceItems,
      },
      modules: {
        active: moduleRows.map((m) => m.module_key),
        config: modulesConfig,
      },
      metrics: {
        // V1: Vacío. En fases futuras incluirá cuotas y rate limits.
      },
      version: RUNTIME_VERSION,
      resolved_at: new Date().toISOString(),
    };

    // 4. Respuesta exitosa
    return NextResponse.json({ ok: true, runtime }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[n8n/context] Error interno:', message);
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------------------------
// GET: Respuesta informativa para pruebas manuales en navegador
// -------------------------------------------------------------------------------------
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: 'FAIREX N8N Context Resolver',
    version: RUNTIME_VERSION,
    method: 'POST',
    required_headers: { 'x-n8n-secret': '<N8N_CONTEXT_SECRET env var>' },
    required_body: {
      provider: 'whatsapp | facebook | instagram | tiktok | shopify | webchat | ...',
      identifier: 'provider_account_id (ej: WhatsApp Phone Number ID)',
      metadata: '(opcional) { sender_id, message_id, timestamp, raw }',
    },
  });
}
