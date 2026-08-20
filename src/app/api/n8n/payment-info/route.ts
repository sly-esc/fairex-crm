import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// SEGURIDAD: Reutiliza exactamente el mismo mecanismo que
// /api/n8n/context y /api/n8n/inventory-search.
// ─────────────────────────────────────────────────────────────────────────────
function validateSecret(req: NextRequest): boolean {
  const secret = process.env.N8N_CONTEXT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    console.warn('[n8n/payment-info] ADVERTENCIA: N8N_CONTEXT_SECRET no configurado (modo desarrollo).');
    return true;
  }
  return req.headers.get('x-n8n-secret') === secret;
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT SCHEMA
// Se admiten solo provider + identifier.
// Cualquier campo adicional (company_id, tenant, etc.) es ignorado porque
// el schema tiene .strict() — si el caller envía company_id, la petición es rechazada.
// ─────────────────────────────────────────────────────────────────────────────
const RequestSchema = z.object({
  provider:   z.string().trim().min(1).max(64),
  identifier: z.string().trim().min(1).max(128),
}).strict(); // rechaza propiedades desconocidas

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Autenticación
  if (!validateSecret(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // 2. Parse + validación de body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'provider e identifier son requeridos y deben ser strings no vacíos',
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }

  const { provider, identifier } = parsed.data;

  // Normalización de identifier para ycloud (solo dígitos)
  let normalizedIdentifier = identifier;
  if (provider === 'ycloud') {
    normalizedIdentifier = identifier.replace(/\D/g, '');
    if (!normalizedIdentifier) {
      return NextResponse.json(
        { ok: false, error: 'Identifier inválido para provider ycloud', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }
  }

  const supabase = createAdminClient();

  try {
    // 3. Resolución de tenant: provider + identifier → company_id
    // El caller nunca puede proporcionar company_id directamente.
    const { data: integration, error: integrationError } = await supabase
      .from('company_integrations')
      .select('company_id')
      .eq('provider', provider)
      .eq('provider_account_id', normalizedIdentifier)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { ok: false, error: 'Integración no encontrada o inactiva', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const resolvedCompanyId = integration.company_id;

    // 4. Verificar que la empresa esté activa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, estado')
      .eq('id', resolvedCompanyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { ok: false, error: 'Empresa no encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (company.estado !== 'activa') {
      return NextResponse.json(
        { ok: false, error: 'La empresa está inactiva', code: 'COMPANY_INACTIVE' },
        { status: 403 }
      );
    }

    // 5. Consultar configuración de pagos activa para esa empresa.
    //    Aunque se usa createAdminClient(), se filtra explícitamente por
    //    el company_id resuelto internamente como barrera multiempresa adicional.
    const { data: paymentSettings, error: psError } = await supabase
      .from('company_payment_settings')
      .select('bank_name, account_holder, clabe, account_number, instructions')
      .eq('company_id', resolvedCompanyId)   // ← barrera multiempresa explícita
      .eq('is_active', true)
      .maybeSingle();

    if (psError) {
      console.error('[n8n/payment-info] Error al consultar payment settings:', psError.message);
      return NextResponse.json(
        { ok: false, error: 'Error interno al consultar configuración de pagos', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 6. Sin configuración activa → available: false (nunca 500)
    if (!paymentSettings) {
      return NextResponse.json(
        { ok: true, available: false },
        { status: 200 }
      );
    }

    // 7. Respuesta con datos bancarios (minimizados: sin id, company_id, timestamps)
    return NextResponse.json(
      {
        ok:             true,
        available:      true,
        method:         'bank_transfer',
        bank_name:      paymentSettings.bank_name,
        account_holder: paymentSettings.account_holder,
        clabe:          paymentSettings.clabe ?? null,
        account_number: paymentSettings.account_number ?? null,
        instructions:   paymentSettings.instructions ?? null,
      },
      { status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[n8n/payment-info] Error interno:', message);
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
